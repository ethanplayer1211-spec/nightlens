import {createCityPostprocess} from './cityPostprocess';
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
uniform sampler2D waterMask,pavingColor,pavingNormal,pavingRoughness;
uniform vec2 waterOrigin,waterExtent;
uniform float hasWater,hasPaving,wetness;
uniform float moonLight,eyeElevation,sunAltitude,cityLight,selectedLight,baselineLight,comparison,split,pixelWidth,fixtureOutput,haze,warmth,overcast;
varying vec3 world,norm;
varying vec4 baseColor;
varying vec2 mat;
const float PI=3.14159265;
float random(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.0,1.0);}
vec3 fresnel(float d,vec3 f0){return f0+(1.0-f0)*pow(1.0-clamp(d,0.0,1.0),5.0);}
vec3 specular(vec3 n,vec3 v,vec3 l,float rough,vec3 f0){
  vec3 h=normalize(v+l);float nl=max(dot(n,l),0.0),nv=max(dot(n,v),.001),nh=max(dot(n,h),0.0),vh=max(dot(v,h),0.0);
  float a=max(.025,rough*rough),a2=a*a,den=nh*nh*(a2-1.0)+1.0;
  float D=a2/max(.00001,PI*den*den),k=(rough+1.0)*(rough+1.0)/8.0;
  float G=nv/(nv*(1.0-k)+k)*nl/(nl*(1.0-k)+k);
  return fresnel(vh,f0)*D*G/max(.001,4.0*nv*nl)*nl;
}
void main(){
  vec2 waterUV=(world.xz-waterOrigin)/waterExtent;
  if(hasWater>.5&&mat.y>5.5&&mat.y<6.5&&all(greaterThanEqual(waterUV,vec2(0.0)))&&all(lessThanEqual(waterUV,vec2(1.0)))&&texture2D(waterMask,waterUV).r>.5)discard;
  vec3 n=normalize(norm),v=normalize(vec3(-world.x,eyeElevation-world.y,-world.z));
  float distance=length(world.xz),day=smoothstep(-12.0,5.0,sunAltitude),night=1.0-day;
  float before=comparison*(1.0-step(split,gl_FragCoord.x/pixelWidth));
  float light=mix(selectedLight,baselineLight,before)/100.0,city=mix(cityLight,baselineLight,before)/100.0;
  vec3 albedo=pow(baseColor.rgb,vec3(2.2));float rough=.72,metallic=0.0;
  bool landmarkMetal=abs(mat.y-14.0)<.4||abs(mat.y-16.0)<.4,landmarkGlass=abs(mat.y-15.0)<.4;
  bool heritage=abs(mat.y-17.0)<.4;
  bool facade=(mat.y>6.5&&mat.y<9.5)||heritage,steel=(mat.y>8.5&&mat.y<9.5)||landmarkMetal,paving=mat.y>9.5&&mat.y<10.5;
  bool metal=mat.y>1.5&&mat.y<2.5,water=mat.y>2.5&&mat.y<3.5,glazing=mat.y>6.5&&mat.y<7.5;
  if(metal||steel){rough=.24;metallic=.70;}
  if(glazing){rough=.19;albedo*=.65;}
  if(landmarkMetal){rough=mat.y>15.5?.10:.51;metallic=.50;}if(landmarkGlass){rough=.12;metallic=.45;}
  if(paving){
    vec2 uv=world.xz*.5;
    vec3 color=texture2D(pavingColor,uv).rgb;
    albedo=mix(albedo,pow(color,vec3(2.2)),hasPaving*.82);
    vec3 bump=texture2D(pavingNormal,uv).xyz*2.0-1.0;
    n=normalize(mix(n,vec3(bump.x,bump.z,bump.y),hasPaving*.12));
    rough=mix(.72,texture2D(pavingRoughness,uv).r,hasPaving);
    rough=mix(rough,.12,wetness);albedo*=1.0-wetness*.42;
  }
  if(water){
    float a=sin(world.x*.52+world.z*.71),b=sin(world.z*1.9-world.x*.38);
    n=normalize(vec3(a*.045,1.0,b*.035));rough=.13;albedo*=.6;
  }
  vec3 f0=mix(vec3(.035),albedo,metallic);
  vec3 ambient=vec3(.004,.007,.012)+vec3(.34,.41,.49)*day+vec3(.035,.035,.033)*city*night;
  vec3 lamp=mix(vec3(.74,.84,1.0),vec3(1.0,.66,.30),warmth*(1.0-before));
  vec3 c=albedo*ambient*(.65+.35*max(0.0,n.y))*(1.0-metallic*.75);
  float directTransmission=pow(1.0-overcast,3.0);
  c+=albedo*max(0.0,dot(n,sunDirection))*day*1.65*directTransmission;
  c+=specular(n,v,sunDirection,rough,f0)*day*2.8*directTransmission;
  c+=albedo*vec3(.64,.77,1.0)*max(0.0,dot(n,moonDirection))*moonLight*.055*night*directTransmission;
  c+=specular(n,v,moonDirection,rough,f0)*moonLight*.15*night*directTransmission;
  vec3 reflection=reflect(-v,n);
  vec3 reflectedSky=mix(vec3(.004,.008,.016)+lamp*light*.022,vec3(.24,.38,.55),day);
  reflectedSky=mix(reflectedSky,vec3(.10,.13,.15)*day+lamp*city*.028,exp(-max(0.0,reflection.y)*6.0));
  if(metal||steel||glazing||water||paving||landmarkGlass)c+=reflectedSky*fresnel(max(dot(n,v),0.0),f0)*(1.0-rough*.7);
  float fixture=mat.y>4.5&&mat.y<5.5?city*mix(fixtureOutput,1.0,before):light;
  c+=lamp*mat.x*fixture*night*1.8;
  if(landmarkMetal||landmarkGlass){
    float fy=fract(world.y/4.1),aa=clamp(distance*.00005,.015,.16),band=1.0-smoothstep(.035-aa,.035+aa,min(fy,1.0-fy));
    float u=fract((world.x+world.z)*.55),rib=1.0-smoothstep(.018,.075,min(u,1.0-u));
    c+=vec3(.65,.79,1.0)*city*night*(landmarkMetal?.014:.004);
    c+=vec3(.68,.80,.96)*city*night*(band*.32+rib*.018);
  }
  if(landmarkGlass)c+=albedo*vec3(.60,.75,.90)*city*night*.055;
  if(facade)c+=albedo*lamp*city*night*.045;
  if(facade&&abs(n.y)<.4){
    float horizontal=abs(n.x)>abs(n.z)?world.z:world.x;
    float u=fract(horizontal/(steel?2.0:2.9)),floorY=world.y/(steel?4.1:3.6),fy=fract(floorY);
    float aa=clamp(distance*.00006,.015,.22);
    float windows=smoothstep(.12-aa,.12+aa,u)*(1.0-smoothstep(.84-aa,.84+aa,u))*smoothstep(.17-aa,.17+aa,fy)*(1.0-smoothstep(.80-aa,.80+aa,fy));
    float cell=random(vec2(floor(horizontal/2.9),floor(floorY)));
    vec3 room=mix(vec3(1.0,.58,.24),vec3(.55,.72,1.0),step(.80,cell));
    float lit=step(.69,cell)*mix(.12,1.1,random(vec2(floor(horizontal/18.0),floor(floorY/4.0))));
    c*=1.0-windows*.40;
    if(heritage){
      float louvers=step(.5,fract(world.y*8.0));
      c=mix(c,vec3(.018,.049,.043)*(.70+.30*louvers)+vec3(.025)*day,windows*.75);
    }
    c+=room*windows*lit*city*night*.30;
    if(steel){
      float band=1.0-smoothstep(.018,.10,min(fy,1.0-fy));
      c+=vec3(.68,.80,1.0)*city*night*(.012+.28*band)*(1.0-abs(n.y)*.4);
    }
  }
  // A selected finish/lighting impression; no assertion of measured facade luminance.
  if(paving)c+=albedo*lamp*city*night*.08;
  if(abs(mat.y-18.0)<.4){float tile=fract(world.x*1.3)+fract(world.z*1.5);c*=.85+.15*smoothstep(.0,.25,tile);}
  if(mat.y>3.5&&mat.y<4.5)c*=.94+.06*sin(world.y*.8+world.x*.014);
  c=pow(aces(c*1.25),vec3(1.0/2.2));
  float fog=(1.0-exp(-distance*(.000075+haze*.00025)))*.88;
  vec3 atmosphere=mix(vec3(.010,.019,.032)+vec3(.10,.115,.13)*pow(light,1.3),vec3(.36,.48,.58),day);
  c=mix(c,atmosphere,fog);
  gl_FragColor=vec4(clamp(c,0.0,1.0),baseColor.a);
}`;
export interface CityGPU {draw:(props:ImmersiveSkyProps,width:number,height:number)=>SceneMesh|null;destroy:()=>void}
export function createCityGPU(canvas:HTMLCanvasElement,onMaterialReady:()=>void=()=>{}):CityGPU|null{
  const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false,powerPreference:'high-performance',depth:true});if(!gl)return null;
  let post:ReturnType<typeof createCityPostprocess>=null;
  let program:WebGLProgram|null=null,vs:WebGLShader|null=null,fs:WebGLShader|null=null;
  const buffers:WebGLBuffer[]=[];let waterTexture:WebGLTexture|null=null;const materialTextures:WebGLTexture[]=[];
  try{
    const compile=(type:number,source:string)=>{const s=gl.createShader(type);if(!s)throw new Error('Scene shader allocation failed');gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);throw new Error('Scene shader unavailable');}return s;};
    vs=compile(gl.VERTEX_SHADER,vertex);fs=compile(gl.FRAGMENT_SHADER,fragment);program=gl.createProgram();if(!program)throw new Error('Scene program allocation failed');gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Scene program unavailable');
    const attributes=['position','normal','color','material'].map(name=>gl.getAttribLocation(program!,name));
    const names=['forward','rightward','upward','eyeElevation','tangent','aspect','sunDirection','moonDirection','moonLight','sunAltitude','cityLight','selectedLight','baselineLight','comparison','split','pixelWidth','fixtureOutput','haze','warmth','overcast','waterMask','waterOrigin','waterExtent','hasWater','pavingColor','pavingNormal','pavingRoughness','hasPaving','wetness'];
    const uniforms=Object.fromEntries(names.map(name=>[name,gl.getUniformLocation(program!,name)]));
    const opaque=gl.createBuffer(),glass=gl.createBuffer();if(!opaque||!glass)throw new Error('Scene buffer allocation failed');buffers.push(opaque,glass);
    let materialsLoaded=0;
    for(const [i,name] of ['diffuse','normal-gl','roughness'].entries()){
      const texture=gl.createTexture();if(!texture)throw new Error('Material allocation failed');materialTextures.push(texture);gl.activeTexture(gl.TEXTURE1+i);gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,1,1,0,gl.RGB,gl.UNSIGNED_BYTE,new Uint8Array(i===1?[128,128,255]:[128,128,128]));gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      const image=new Image();image.onload=()=>{if(disposed)return;gl.activeTexture(gl.TEXTURE1+i);gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,image);gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);materialsLoaded++;onMaterialReady();};image.src=document.getElementById(`nightlens-paving-${name}`)?.getAttribute('src')??`/data/realism/square-floor-${name}-1k.jpg`;
    }
    gl.activeTexture(gl.TEXTURE0);waterTexture=gl.createTexture();if(!waterTexture)throw new Error('Water-mask allocation failed');
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
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,waterTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,surface);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    };
    post=createCityPostprocess(gl);
    let scene:CityScene|undefined,mesh:SceneMesh|null=null,disposed=false;
    const bind=(buffer:WebGLBuffer)=>{gl.bindBuffer(gl.ARRAY_BUFFER,buffer);for(let i=0;i<4;i++){gl.enableVertexAttribArray(attributes[i]);gl.vertexAttribPointer(attributes[i],[3,3,4,2][i],gl.FLOAT,false,48,[0,12,24,40][i]);}};
    return{
      draw(p,width,height){
        if(disposed||gl.isContextLost())return null;
        gl.bindFramebuffer(gl.FRAMEBUFFER,null);
        if(p.filters.horizon==='viewpoint'&&p.scene)post?.begin(width,height);
        gl.viewport(0,0,width,height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
        if(p.filters.horizon!=='viewpoint'||!p.scene)return null;
        if(scene!==p.scene){scene=p.scene;mesh=buildSceneMesh(scene);uploadWater(scene);gl.bindBuffer(gl.ARRAY_BUFFER,opaque);gl.bufferData(gl.ARRAY_BUFFER,mesh.opaque,gl.STATIC_DRAW);gl.bindBuffer(gl.ARRAY_BUFFER,glass);gl.bufferData(gl.ARRAY_BUFFER,mesh.glass,gl.STATIC_DRAW);}
        if(!mesh)return null;
        gl.useProgram(program);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,waterTexture);gl.uniform1i(uniforms.waterMask,0);for(const [i,name] of ['pavingColor','pavingNormal','pavingRoughness'].entries()){gl.activeTexture(gl.TEXTURE1+i);gl.bindTexture(gl.TEXTURE_2D,materialTextures[i]);gl.uniform1i(uniforms[name],1+i);}gl.uniform1f(uniforms.hasPaving,materialsLoaded===3?1:0);gl.uniform1f(uniforms.wetness,.12);gl.uniform2f(uniforms.waterOrigin,waterBounds[0],waterBounds[1]);gl.uniform2f(uniforms.waterExtent,waterBounds[2],waterBounds[3]);gl.uniform1f(uniforms.hasWater,p.scene.water?.polygons.length?1:0);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);gl.depthMask(true);gl.disable(gl.BLEND);
        const rad=Math.PI/180,a=p.camera.azimuth*rad,h=p.camera.altitude*rad;
        gl.uniform3f(uniforms.forward,Math.cos(h)*Math.sin(a),Math.sin(h),Math.cos(h)*Math.cos(a));gl.uniform3f(uniforms.rightward,Math.cos(a),0,-Math.sin(a));gl.uniform3f(uniforms.upward,-Math.sin(h)*Math.sin(a),Math.cos(h),-Math.sin(h)*Math.cos(a));
        gl.uniform1f(uniforms.eyeElevation,p.scene.eyeElevation);gl.uniform1f(uniforms.tangent,Math.tan(p.camera.fieldOfView*rad/2));gl.uniform1f(uniforms.aspect,width/height);
        const sa=p.sky.sunAzimuth*rad,sh=p.sky.sunAltitude*rad;gl.uniform3f(uniforms.sunDirection,Math.cos(sh)*Math.sin(sa),Math.sin(sh),Math.cos(sh)*Math.cos(sa));
        const ma=(p.sky.objects.find(o=>o.kind==='moon')?.azimuth??0)*rad,mh=p.sky.moonAltitude*rad;gl.uniform3f(uniforms.moonDirection,Math.cos(mh)*Math.sin(ma),Math.sin(mh),Math.cos(mh)*Math.cos(ma));
        gl.uniform1f(uniforms.moonLight,(p.filters.moonlightEnabled?1:0)*Math.max(0,Math.sin(mh))*p.sky.moonIllumination);
        gl.uniform1f(uniforms.overcast,Math.max(0,Math.min(1,p.cloudCover/100*p.filters.cloudOpacityPercent/100)));
        gl.uniform1f(uniforms.sunAltitude,p.sky.sunAltitude);gl.uniform1f(uniforms.cityLight,p.cityLightPercent);gl.uniform1f(uniforms.selectedLight,p.lightPollution);gl.uniform1f(uniforms.baselineLight,p.compareLightPollution);
        gl.uniform1f(uniforms.comparison,p.comparison?1:0);gl.uniform1f(uniforms.split,p.split/100);gl.uniform1f(uniforms.pixelWidth,width);gl.uniform1f(uniforms.fixtureOutput,p.fixtureOutput);gl.uniform1f(uniforms.haze,p.filters.hazePercent/100);gl.uniform1f(uniforms.warmth,p.warmth);
        bind(opaque);gl.drawArrays(gl.TRIANGLES,0,mesh.opaque.length/12);
        gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);bind(glass);gl.drawArrays(gl.TRIANGLES,0,mesh.glass.length/12);gl.depthMask(true);
        post?.end(1-Math.max(0,Math.min(1,(p.sky.sunAltitude+12)/17)));
        return mesh;
      },
      destroy(){disposed=true;post?.destroy();gl.deleteTexture(waterTexture);for(const t of materialTextures)gl.deleteTexture(t);for(const b of buffers)gl.deleteBuffer(b);gl.deleteProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);},
    };
  }catch{post?.destroy();gl.deleteTexture(waterTexture);for(const t of materialTextures)gl.deleteTexture(t);for(const b of buffers)gl.deleteBuffer(b);if(program)gl.deleteProgram(program);if(vs)gl.deleteShader(vs);if(fs)gl.deleteShader(fs);return null;}
}
