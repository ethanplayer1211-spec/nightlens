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
uniform vec3 forward,rightward,upward,sunDirection,moonDirection;
uniform float tangent,aspect,sunAltitude,moonLight,pollution,baselinePollution,comparison,split,clouds;
uniform float haze,cloudOpacity,glare,fixtureGlare,warmth,exposure,horizonKind,eyeHeight;
const float PI=3.141592653589793;
float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float cloudField(vec3 p){return noise(p)*.55+noise(p*2.1)*.28+noise(p*4.3)*.12+noise(p*9.1)*.05;}
void main(){
  vec3 ray=normalize(forward+rightward*screen.x*tangent+upward*screen.y*tangent/aspect);
  float elevation=ray.y;
  float before=comparison*(1.0-step(split,screen.x*.5+.5));
  float light=mix(pollution,baselinePollution,before)/100.0;
  float daylight=smoothstep(-14.0,4.0,sunAltitude);
  float darkness=1.0-smoothstep(-18.0,-3.0,sunAltitude);
  vec3 lamp=mix(vec3(.20,.245,.29),vec3(.31,.21,.125),warmth*(1.0-before));
  if(elevation<0.0){
    float height=horizonKind>.5&&horizonKind<1.5?1.7:eyeHeight;
    float distance=min(4000.0,height/max(.001,-elevation));
    vec3 hit=vec3(ray.x*distance,0.0,ray.z*distance);
    float grain=noise(hit*.8),far=exp(-distance*.012);
    vec3 ground=vec3(.018,.024,.030)+vec3(.012,.014,.016)*grain;
    if(horizonKind>1.5&&horizonKind<2.5){
      float ripple=.5+.25*sin(hit.z*.7+sin(hit.x*.18)*2.0)+.25*sin(hit.z*2.4+hit.x*.6);
      ground=vec3(.012,.026,.039)+vec3(.009,.018,.027)*ripple;
      vec3 reflection=vec3(ray.x,-ray.y,ray.z);
      float lunar=pow(max(0.0,dot(reflection,moonDirection)),80.0)*moonLight;
      ground+=vec3(.19,.23,.25)*lunar*ripple;
      ground+=lamp*light*(.035+.055*ripple)*(1.0-daylight);
    }else if(horizonKind>2.5){
      ground=mix(vec3(.009,.022,.018),vec3(.022,.034,.024),grain)+vec3(.012,.018,.007)*far;
    }else{
      float seam=step(.97,fract(hit.x*.16))+step(.98,fract(hit.z*.16));
      ground+=vec3(.009)*seam*far;
      ground+=lamp*light*(.02+.10*far)*(1.0-daylight);
    }
    ground=mix(ground,ground*3.2+vec3(.10,.11,.12),daylight);
    ground=mix(ground,vec3(.024,.034,.047)+lamp*light*.10,min(.65,distance/5000.0));
    gl_FragColor=vec4(ground,1.0);return;
  }
  float horizon=exp(-elevation*4.8);
  vec3 gal=normalize(worldToGalactic*ray);
  vec2 uv=vec2(fract(.5-atan(gal.y,gal.x)/(2.0*PI)),.5-asin(clamp(gal.z,-1.0,1.0))/PI);
  vec3 field=pow(texture2D(survey,uv).rgb,vec3(1.35))*exposure*hasSurvey;
  float attenuation=exp(-haze*(.4+1.8*horizon));
  float surveyContrast=darkness*pow(1.0-light,3.5)*attenuation*(1.0-moonLight*.85)*(1.0-glare*fixtureGlare*light*.85);
  vec3 color=vec3(.003,.006,.011)+field*surveyContrast;
  vec3 day=mix(vec3(.18,.36,.55),vec3(.49,.61,.69),horizon*.65);
  color=mix(color,day,daylight);
  float sunProximity=pow(max(0.0,dot(ray,sunDirection)),18.0);
  float twilight=(1.0-smoothstep(-1.0,5.0,sunAltitude))*smoothstep(-18.0,-5.0,sunAltitude);
  color+=vec3(.28,.12,.05)*horizon*twilight*(.2+.8*sunProximity);
  color+=lamp*pow(light,1.3)*(.22+.78*horizon)*(1.0-daylight*.9)*(1.0+haze*.7);
  color+=vec3(.018,.026,.042)*moonLight*(.5+.5*horizon)*(1.0-daylight);
  color+=lamp*glare*fixtureGlare*light*.20*(1.0-daylight);
  float pattern=cloudField(ray*7.0+vec3(7,3,19));
  float cloudMask=smoothstep(1.0-clouds-.13,1.0-clouds+.13,pattern)*step(.001,clouds);
  if(clouds>.995)cloudMask=1.0;
  vec3 cloudColor=mix(vec3(.026,.036,.05)+lamp*light*(.48+haze*.2)+moonLight*.045,vec3(.64,.69,.72),daylight);
  color=mix(color,cloudColor,cloudMask*cloudOpacity);
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
    const names = ['survey','hasSurvey','worldToGalactic','forward','rightward','upward','sunDirection','tangent','aspect','sunAltitude','moonLight','pollution','baselinePollution','comparison','split','clouds','moonDirection','haze','cloudOpacity','glare','fixtureGlare','warmth','exposure','horizonKind','eyeHeight'];
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
        gl.uniform1f(uniforms.moonLight, (props.filters.moonlightEnabled ? 1 : 0) * Math.max(0, Math.sin(props.sky.moonAltitude * rad)) * props.sky.moonIllumination);
        gl.uniform1f(uniforms.pollution, props.lightPollution); gl.uniform1f(uniforms.baselinePollution, props.compareLightPollution);
        gl.uniform1f(uniforms.comparison, props.comparison ? 1 : 0); gl.uniform1f(uniforms.split, props.split / 100); gl.uniform1f(uniforms.clouds, props.cloudCover / 100);
        const moon = props.sky.objects.find(o => o.kind === 'moon');
        const ma=(moon?.azimuth ?? 0)*rad,mh=(moon?.altitude ?? -90)*rad;
        gl.uniform3f(uniforms.moonDirection,Math.cos(mh)*Math.sin(ma),Math.sin(mh),Math.cos(mh)*Math.cos(ma));
        gl.uniform1f(uniforms.haze,props.filters.hazePercent/100);gl.uniform1f(uniforms.cloudOpacity,props.filters.cloudOpacityPercent/100);
        gl.uniform1f(uniforms.glare,props.filters.glarePercent/100);gl.uniform1f(uniforms.fixtureGlare,props.fixtureGlare);
        gl.uniform1f(uniforms.warmth,props.warmth);gl.uniform1f(uniforms.exposure,props.filters.viewStyle==='survey'?0.82:0.23);
        gl.uniform1f(uniforms.horizonKind,['local','rooftop','coast','meadow'].indexOf(props.filters.horizon));gl.uniform1f(uniforms.eyeHeight,props.filters.observerHeight);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      },
      destroy() { disposed = true; image.onload = null; image.onerror = null; gl.deleteTexture(texture); gl.deleteBuffer(buffer); gl.deleteProgram(program); gl.deleteShader(vertex); gl.deleteShader(fragment); },
    };
  } catch {
    if (texture) gl.deleteTexture(texture); if (buffer) gl.deleteBuffer(buffer); if (program) gl.deleteProgram(program); if (vertex) gl.deleteShader(vertex); if (fragment) gl.deleteShader(fragment);
    return null;
  }
}
