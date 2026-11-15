import type { ImmersiveSkyProps } from './skyView';
import { buildSceneMesh,type SceneMesh } from './sceneMesh';
import {localPoint,type CityScene} from './cityScene';

const vertex=`
attribute vec3 position,normal;
attribute vec4 color;
attribute vec2 material;
uniform vec3 forward,rightward,upward;
uniform float eyeElevation,tangent,aspect;
varying vec3 world,norm;
varying vec4 baseColor;
varying vec2 mat;
void main(){
  vec3 p=position-vec3(0.0,eyeElevation,0.0);
  float z=dot(p,forward);
  gl_Position=vec4(dot(p,rightward)/tangent,dot(p,upward)*aspect/tangent,1.00001*z-.3000015,z);
  world=position;norm=normal;baseColor=color;mat=material;
}`;
const fragment=`
precision highp float;
uniform vec3 sunDirection,moonDirection;
uniform sampler2D waterMask;
uniform vec2 waterOrigin,waterExtent;
uniform float hasWater;
uniform float moonLight,eyeElevation,sunAltitude,cityLight,selectedLight,baselineLight,comparison,split,pixelWidth,fixtureOutput,haze,warmth;
varying vec3 world,norm;
varying vec4 baseColor;
varying vec2 mat;
void main(){
  vec2 waterUV=(world.xz-waterOrigin)/waterExtent;
  if(hasWater>.5&&mat.y>5.5&&mat.y<6.5&&all(greaterThanEqual(waterUV,vec2(0.0)))&&all(lessThanEqual(waterUV,vec2(1.0)))&&texture2D(waterMask,waterUV).r>.5)discard;
  vec3 n=normalize(norm),view=normalize(vec3(-world.x,eyeElevation-world.y,-world.z));
  float daylight=smoothstep(-12.0,5.0,sunAltitude);
  float before=comparison*(1.0-step(split,gl_FragCoord.x/pixelWidth));
  float light=mix(selectedLight,baselineLight,before)/100.0;
  float city=mix(cityLight,baselineLight,before)/100.0;
  float diffuse=max(0.0,dot(n,sunDirection));
  float ambient=.09+.38*daylight+(.16*light+.08*moonLight)*(1.0-daylight);
  vec3 c=baseColor.rgb*(ambient+diffuse*daylight*.65);
  c+=baseColor.rgb*vec3(.65,.77,1.0)*max(0.0,dot(n,moonDirection))*moonLight*.14*(1.0-daylight);
  vec3 lamp=mix(vec3(.77,.84,.91),vec3(.98,.76,.44),warmth*(1.0-before));
  float source=mat.y>4.5?city*mix(fixtureOutput,1.0,before):mat.y>.5&&mat.y<1.5?city:light;
  vec3 emitted=mat.y>.5&&mat.y<1.5?mix(vec3(.92,.70,.40),vec3(.65,.79,.88),step(.65,fract(world.x*.13+world.z*.17))):lamp;
  c+=emitted*mat.x*source*(1.0-daylight)*.80;
  if(abs(n.y)<.35&&mat.y>6.5&&mat.y<8.5&&mat.x<.2){
    float horizontal=abs(n.x)>abs(n.z)?world.z:world.x;
    float u=fract(horizontal/3.2),v=fract(world.y/3.8);
    float seed=fract(sin(floor(horizontal/3.2)*12.9898+floor(world.y/3.8)*78.233)*43758.5453);
    float window=step(.25,u)*step(u,.74)*step(.18,v)*step(v,.73);
    c=mix(c,c*.42,window);
    c+=vec3(.35,.28,.17)*window*step(.77,seed)*city*(1.0-daylight);
  }
  if((mat.y>1.5&&mat.y<3.5)||(mat.y>6.5&&mat.y<7.5)){
    vec3 halfVector=normalize(sunDirection+view);
    float spec=pow(max(0.0,dot(n,halfVector)),42.0);
    c+=vec3(.42,.48,.53)*spec*daylight;
    c+=vec3(.025,.05,.075)*pow(1.0-abs(dot(n,view)),3.0);
  }
  if(mat.y>2.5&&mat.y<3.5){
    float ripples=.5+.22*sin(world.x*.65+world.z*1.9)+.18*sin(world.z*4.7-world.x*.29);
    c*=.65+.55*ripples;c+=vec3(.015,.03,.045)*ripples;
  }
  if(mat.y>3.5&&mat.y<4.5)c*=.9+.1*sin(world.y*1.3+world.x*.02);
  float distance=length(world.xz);
  float fog=(1.0-exp(-distance*(.00006+haze*.00018)))*.90;
  vec3 atmosphere=mix(vec3(.012,.022,.037)+vec3(.055,.07,.083)*light,vec3(.31,.43,.54),daylight);
  c=mix(c,atmosphere,fog);
  gl_FragColor=vec4(clamp(c,0.0,1.0),baseColor.a);
}`;
export interface CityGPU {draw:(props:ImmersiveSkyProps,width:number,height:number)=>SceneMesh|null;destroy:()=>void}
export function createCityGPU(canvas:HTMLCanvasElement):CityGPU|null{
  const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false,powerPreference:'high-performance',depth:true});if(!gl)return null;
  let program:WebGLProgram|null=null,vs:WebGLShader|null=null,fs:WebGLShader|null=null;
  const buffers:WebGLBuffer[]=[];let waterTexture:WebGLTexture|null=null;
  try{
    const compile=(type:number,source:string)=>{const s=gl.createShader(type);if(!s)throw new Error('Scene shader allocation failed');gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);throw new Error('Scene shader unavailable');}return s;};
    vs=compile(gl.VERTEX_SHADER,vertex);fs=compile(gl.FRAGMENT_SHADER,fragment);program=gl.createProgram();if(!program)throw new Error('Scene program allocation failed');gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Scene program unavailable');
    const attributes=['position','normal','color','material'].map(name=>gl.getAttribLocation(program!,name));
    const names=['forward','rightward','upward','eyeElevation','tangent','aspect','sunDirection','moonDirection','moonLight','sunAltitude','cityLight','selectedLight','baselineLight','comparison','split','pixelWidth','fixtureOutput','haze','warmth','waterMask','waterOrigin','waterExtent','hasWater'];
    const uniforms=Object.fromEntries(names.map(name=>[name,gl.getUniformLocation(program!,name)]));
    const opaque=gl.createBuffer(),glass=gl.createBuffer();if(!opaque||!glass)throw new Error('Scene buffer allocation failed');buffers.push(opaque,glass);
    waterTexture=gl.createTexture();if(!waterTexture)throw new Error('Water-mask allocation failed');
    let waterBounds=[0,0,1,1];
    const uploadWater=(scene:CityScene)=>{
      const surface=document.createElement('canvas');surface.width=surface.height=1024;const ctx=surface.getContext('2d');
      if(!ctx)throw new Error('Water-mask canvas unavailable');
      const polygons=(scene.water?.polygons??[]).map(p=>[p.outer,...p.holes].map(r=>r.map(v=>localPoint(v.lat,v.lon,scene.site))));
      const all=polygons.flat(2);
      if(all.length){
        const minE=Math.min(...all.map(p=>p.east)),minN=Math.min(...all.map(p=>p.north)),maxE=Math.max(...all.map(p=>p.east)),maxN=Math.max(...all.map(p=>p.north));
        waterBounds=[minE,minN,Math.max(1,maxE-minE),Math.max(1,maxN-minN)];ctx.fillStyle='white';
        for(const polygon of polygons){ctx.beginPath();for(const ring of polygon){ring.forEach((p,i)=>{const x=(p.east-minE)/waterBounds[2]*1024,y=(p.north-minN)/waterBounds[3]*1024;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});ctx.closePath();}ctx.fill('evenodd');}
      }
      gl.bindTexture(gl.TEXTURE_2D,waterTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,surface);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    };
    let scene:CityScene|undefined,mesh:SceneMesh|null=null,disposed=false;
    const bind=(buffer:WebGLBuffer)=>{gl.bindBuffer(gl.ARRAY_BUFFER,buffer);for(let i=0;i<4;i++){gl.enableVertexAttribArray(attributes[i]);gl.vertexAttribPointer(attributes[i],[3,3,4,2][i],gl.FLOAT,false,48,[0,12,24,40][i]);}};
    return{
      draw(p,width,height){
        if(disposed||gl.isContextLost())return null;
        gl.viewport(0,0,width,height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
        if(p.filters.horizon!=='viewpoint'||!p.scene)return null;
        if(scene!==p.scene){scene=p.scene;mesh=buildSceneMesh(scene);uploadWater(scene);gl.bindBuffer(gl.ARRAY_BUFFER,opaque);gl.bufferData(gl.ARRAY_BUFFER,mesh.opaque,gl.STATIC_DRAW);gl.bindBuffer(gl.ARRAY_BUFFER,glass);gl.bufferData(gl.ARRAY_BUFFER,mesh.glass,gl.STATIC_DRAW);}
        if(!mesh)return null;
        gl.useProgram(program);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,waterTexture);gl.uniform1i(uniforms.waterMask,0);gl.uniform2f(uniforms.waterOrigin,waterBounds[0],waterBounds[1]);gl.uniform2f(uniforms.waterExtent,waterBounds[2],waterBounds[3]);gl.uniform1f(uniforms.hasWater,p.scene.water?.polygons.length?1:0);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);gl.depthMask(true);gl.disable(gl.BLEND);
        const rad=Math.PI/180,a=p.camera.azimuth*rad,h=p.camera.altitude*rad;
        gl.uniform3f(uniforms.forward,Math.cos(h)*Math.sin(a),Math.sin(h),Math.cos(h)*Math.cos(a));gl.uniform3f(uniforms.rightward,Math.cos(a),0,-Math.sin(a));gl.uniform3f(uniforms.upward,-Math.sin(h)*Math.sin(a),Math.cos(h),-Math.sin(h)*Math.cos(a));
        gl.uniform1f(uniforms.eyeElevation,p.scene.eyeElevation);gl.uniform1f(uniforms.tangent,Math.tan(p.camera.fieldOfView*rad/2));gl.uniform1f(uniforms.aspect,width/height);
        const sa=p.sky.sunAzimuth*rad,sh=p.sky.sunAltitude*rad;gl.uniform3f(uniforms.sunDirection,Math.cos(sh)*Math.sin(sa),Math.sin(sh),Math.cos(sh)*Math.cos(sa));
        const ma=(p.sky.objects.find(o=>o.kind==='moon')?.azimuth??0)*rad,mh=p.sky.moonAltitude*rad;gl.uniform3f(uniforms.moonDirection,Math.cos(mh)*Math.sin(ma),Math.sin(mh),Math.cos(mh)*Math.cos(ma));
        gl.uniform1f(uniforms.moonLight,(p.filters.moonlightEnabled?1:0)*Math.max(0,Math.sin(mh))*p.sky.moonIllumination);
        gl.uniform1f(uniforms.sunAltitude,p.sky.sunAltitude);gl.uniform1f(uniforms.cityLight,p.cityLightPercent);gl.uniform1f(uniforms.selectedLight,p.lightPollution);gl.uniform1f(uniforms.baselineLight,p.compareLightPollution);
        gl.uniform1f(uniforms.comparison,p.comparison?1:0);gl.uniform1f(uniforms.split,p.split/100);gl.uniform1f(uniforms.pixelWidth,width);gl.uniform1f(uniforms.fixtureOutput,p.fixtureOutput);gl.uniform1f(uniforms.haze,p.filters.hazePercent/100);gl.uniform1f(uniforms.warmth,p.warmth);
        bind(opaque);gl.drawArrays(gl.TRIANGLES,0,mesh.opaque.length/12);
        gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);bind(glass);gl.drawArrays(gl.TRIANGLES,0,mesh.glass.length/12);gl.depthMask(true);
        return mesh;
      },
      destroy(){disposed=true;gl.deleteTexture(waterTexture);for(const b of buffers)gl.deleteBuffer(b);gl.deleteProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);},
    };
  }catch{gl.deleteTexture(waterTexture);for(const b of buffers)gl.deleteBuffer(b);if(program)gl.deleteProgram(program);if(vs)gl.deleteShader(vs);if(fs)gl.deleteShader(fs);return null;}
}

