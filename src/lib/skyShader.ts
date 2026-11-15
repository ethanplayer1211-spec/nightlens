import type { ImmersiveSkyProps } from './skyView';

const vertexSource = `
attribute vec2 position;
varying vec2 screen;
void main(){screen=position;gl_Position=vec4(position,0.0,1.0);}`;

const fragmentSource = `
precision highp float;
varying vec2 screen;
uniform sampler2D survey;
uniform float hasSurvey;
uniform mat3 worldToGalactic;
uniform vec3 forward;
uniform vec3 rightward;
uniform vec3 upward;
uniform vec3 sunDirection;
uniform float tangent;
uniform float aspect;
uniform float sunAltitude;
uniform float moonLight;
uniform float pollution;
uniform float baselinePollution;
uniform float comparison;
uniform float split;
uniform float clouds;
const float PI=3.141592653589793;
void main(){
  vec3 ray=normalize(forward+rightward*screen.x*tangent+upward*screen.y*tangent/aspect);
  float elevation=ray.y;
  if(elevation<0.0){
    float edge=exp(elevation*35.0);
    gl_FragColor=vec4(vec3(0.018,0.024,0.028)+vec3(0.012,0.014,0.014)*edge,1.0);return;
  }
  float light=mix(pollution,baselinePollution,comparison*(1.0-step(split,screen.x*0.5+0.5)))/100.0;
  float daylight=smoothstep(-14.0,4.0,sunAltitude);
  float darkness=1.0-smoothstep(-18.0,-3.0,sunAltitude);
  float horizon=exp(-elevation*4.8);
  vec3 gal=normalize(worldToGalactic*ray);
  vec2 uv=vec2(fract(0.5-atan(gal.y,gal.x)/(2.0*PI)),0.5-asin(clamp(gal.z,-1.0,1.0))/PI);
  vec3 field=pow(texture2D(survey,uv).rgb,vec3(1.13))*1.15*hasSurvey;
  float surveyContrast=darkness*pow(1.0-light,2.0)*(1.0-clouds*0.88)*(1.0-moonLight*0.7);
  vec3 color=vec3(0.004,0.008,0.015)+field*surveyContrast;
  vec3 day=mix(vec3(0.19,0.37,0.56),vec3(0.48,0.61,0.69),horizon*0.65);
  color=mix(color,day,daylight);
  float sunProximity=pow(max(0.0,dot(ray,sunDirection)),18.0);
  float twilight=(1.0-smoothstep(-1.0,5.0,sunAltitude))*smoothstep(-18.0,-5.0,sunAltitude);
  color+=vec3(0.31,0.13,0.055)*horizon*twilight*(0.2+0.8*sunProximity);
  color+=vec3(0.38,0.25,0.135)*pow(light,1.3)*(0.18+0.82*horizon)*(1.0-daylight*0.9);
  color+=vec3(0.12,0.16,0.21)*moonLight*(0.6+0.4*horizon)*(1.0-daylight);
  float cloudShape=0.5+0.22*sin(ray.x*12.0+ray.z*7.0)+0.15*sin(ray.z*21.0-ray.x*4.0)+0.1*cos(elevation*29.0+ray.x*17.0);
  color=mix(color,mix(vec3(0.08,0.09,0.10)+light*vec3(0.17,0.13,0.09),vec3(0.64,0.69,0.72),daylight),clouds*clamp(cloudShape,0.0,1.0)*0.7);
  float edge=1.0-smoothstep(0.0,0.004,elevation);
  color=mix(color,vec3(0.15,0.20,0.22),edge*0.45);
  gl_FragColor=vec4(clamp(color,0.0,1.0),1.0);
}`;

export interface SkyGPU { draw: (props: ImmersiveSkyProps, width: number, height: number) => void; destroy: () => void }

export function createSkyGPU(canvas: HTMLCanvasElement, onImageReady: () => void, onImageError: () => void): SkyGPU | null {
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' });
  if (!gl) return null;
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type); if (!shader) throw new Error('Shader allocation failed');
    gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { gl.deleteShader(shader); throw new Error('Sky shader unavailable'); }
    return shader;
  };
  let vertex: WebGLShader | null = null, fragment: WebGLShader | null = null;
  let program: WebGLProgram | null = null, buffer: WebGLBuffer | null = null, texture: WebGLTexture | null = null;
  try {
    vertex = compile(gl.VERTEX_SHADER, vertexSource); fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
    program = gl.createProgram(); if (!program) throw new Error('Sky program unavailable');
    gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Sky program unavailable');
    gl.useProgram(program);
    buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position'); gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    texture = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const names = ['survey','hasSurvey','worldToGalactic','forward','rightward','upward','sunDirection','tangent','aspect','sunAltitude','moonLight','pollution','baselinePollution','comparison','split','clouds'];
    const uniforms = Object.fromEntries(names.map(name => [name, gl.getUniformLocation(program!, name)]));
    gl.uniform1i(uniforms.survey, 0);
    let loaded = false, disposed = false;
    const image = new Image();
    image.onload = () => {
      if (disposed) return;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      // No flip: DOM image top row is sampled at v=0; Galactic north maps to v=0.
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
      loaded = true; onImageReady();
    };
    image.onerror = () => { if (!disposed) onImageError(); };
    image.src = document.getElementById('nightlens-gaia-texture')?.getAttribute('src') ?? '/data/gaia-sky.png';
    return {
      draw(props, width, height) {
        if (disposed || !width || !height || gl.isContextLost()) return;
        gl.viewport(0, 0, width, height); gl.useProgram(program);
        const rad = Math.PI / 180, az = props.camera.azimuth * rad, alt = props.camera.altitude * rad;
        gl.uniform3f(uniforms.forward, Math.cos(alt) * Math.sin(az), Math.sin(alt), Math.cos(alt) * Math.cos(az));
        gl.uniform3f(uniforms.rightward, Math.cos(az), 0, -Math.sin(az));
        gl.uniform3f(uniforms.upward, -Math.sin(alt) * Math.sin(az), Math.cos(alt), -Math.sin(alt) * Math.cos(az));
        const sa = props.sky.sunAzimuth * rad, sh = props.sky.sunAltitude * rad;
        gl.uniform3f(uniforms.sunDirection, Math.cos(sh) * Math.sin(sa), Math.sin(sh), Math.cos(sh) * Math.cos(sa));
        const m = props.worldToGalactic;
        gl.uniformMatrix3fv(uniforms.worldToGalactic, false, new Float32Array([m[0],m[3],m[6],m[1],m[4],m[7],m[2],m[5],m[8]]));
        gl.uniform1f(uniforms.hasSurvey, loaded ? 1 : 0);
        gl.uniform1f(uniforms.tangent, Math.tan(props.camera.fieldOfView * rad / 2)); gl.uniform1f(uniforms.aspect, width / height);
        gl.uniform1f(uniforms.sunAltitude, props.sky.sunAltitude);
        gl.uniform1f(uniforms.moonLight, Math.max(0, Math.sin(props.sky.moonAltitude * rad)) * props.sky.moonIllumination);
        gl.uniform1f(uniforms.pollution, props.lightPollution); gl.uniform1f(uniforms.baselinePollution, props.compareLightPollution);
        gl.uniform1f(uniforms.comparison, props.comparison ? 1 : 0); gl.uniform1f(uniforms.split, props.split / 100); gl.uniform1f(uniforms.clouds, props.cloudCover / 100);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      },
      destroy() { disposed = true; image.onload = null; image.onerror = null; gl.deleteTexture(texture); gl.deleteBuffer(buffer); gl.deleteProgram(program); gl.deleteShader(vertex); gl.deleteShader(fragment); },
    };
  } catch {
    if (texture) gl.deleteTexture(texture); if (buffer) gl.deleteBuffer(buffer); if (program) gl.deleteProgram(program); if (vertex) gl.deleteShader(vertex); if (fragment) gl.deleteShader(fragment);
    return null;
  }
}
