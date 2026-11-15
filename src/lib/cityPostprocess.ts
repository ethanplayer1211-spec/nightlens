/** Subtle optical bloom from actual rendered highlights; no extra scene objects. */
export function createCityPostprocess(gl:WebGLRenderingContext){
  const shaders:WebGLShader[]=[];
  const compile=(kind:number,source:string)=>{const shader=gl.createShader(kind);if(!shader)throw new Error('Post-process allocation failed');shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error('Post-process shader unavailable');return shader;};
  const program=gl.createProgram(),buffer=gl.createBuffer(),texture=gl.createTexture(),depth=gl.createRenderbuffer(),framebuffer=gl.createFramebuffer();
  const destroy=()=>{shaders.forEach(s=>gl.deleteShader(s));gl.deleteProgram(program);gl.deleteBuffer(buffer);gl.deleteTexture(texture);gl.deleteRenderbuffer(depth);gl.deleteFramebuffer(framebuffer);};
  try{
    if(!program||!buffer||!texture||!depth||!framebuffer)throw new Error('Post-process target unavailable');
    gl.attachShader(program,compile(gl.VERTEX_SHADER,'attribute vec2 point;varying vec2 uv;void main(){uv=point*.5+.5;gl_Position=vec4(point,0.0,1.0);}'));
    gl.attachShader(program,compile(gl.FRAGMENT_SHADER,`precision mediump float;varying vec2 uv;uniform sampler2D scene;uniform vec2 pixel;uniform float night;
      vec3 highlight(vec2 pos){vec4 c=texture2D(scene,pos);return max(vec3(0.0),c.rgb-vec3(.65))*c.a;}
      vec4 edgeSample(vec2 pos){
        vec4 c=texture2D(scene,pos),nw=texture2D(scene,pos+pixel*vec2(-1.,1.)),ne=texture2D(scene,pos+pixel),sw=texture2D(scene,pos-pixel),se=texture2D(scene,pos+pixel*vec2(1.,-1.));
        vec3 l=vec3(.299,.587,.114);float a=dot(nw.rgb,l)+nw.a*.15,b=dot(ne.rgb,l)+ne.a*.15,d=dot(sw.rgb,l)+sw.a*.15,e=dot(se.rgb,l)+se.a*.15,m=dot(c.rgb,l)+c.a*.15;
        float lo=min(m,min(min(a,b),min(d,e))),hi=max(m,max(max(a,b),max(d,e)));
        if(hi-lo<max(.035,hi*.12))return c;
        vec2 direction=vec2(-(a+b-d-e),a+d-b-e);float reduce=max((a+b+d+e)*.03125,.0078);
        direction=clamp(direction/(min(abs(direction.x),abs(direction.y))+reduce),vec2(-4.),vec2(4.))*pixel;
        vec4 along=(texture2D(scene,pos-direction/6.)+texture2D(scene,pos+direction/6.))*.5;
        return mix(c,along,.70);
      }
      void main(){vec4 c=edgeSample(uv);vec3 glow=highlight(uv)*.20;
      glow+=(highlight(uv+pixel*vec2(1.5,0.0))+highlight(uv-pixel*vec2(1.5,0.0))+highlight(uv+pixel*vec2(0.0,1.5))+highlight(uv-pixel*vec2(0.0,1.5)))*.13;
      glow+=(highlight(uv+pixel*vec2(3.5,3.5))+highlight(uv-pixel*vec2(3.5,3.5))+highlight(uv+pixel*vec2(3.5,-3.5))+highlight(uv-pixel*vec2(3.5,-3.5)))*.07;
      glow*=night*.32;float alpha=clamp(c.a+max(glow.r,max(glow.g,glow.b)),0.0,1.0);gl_FragColor=vec4((c.rgb+glow)/max(alpha,.0001),alpha);}`));
    gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Post-process link failed');
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    const point=gl.getAttribLocation(program,'point'),scene=gl.getUniformLocation(program,'scene'),pixel=gl.getUniformLocation(program,'pixel'),night=gl.getUniformLocation(program,'night');
    let width=0,height=0;
    return {
      begin(w:number,h:number){
        gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);
        if(width!==w||height!==h){width=w;height=h;gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);gl.bindRenderbuffer(gl.RENDERBUFFER,depth);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,w,h);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,depth);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('Scene frame buffer incomplete');}
      },
      end(nightAmount:number){
        gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,width,height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(program);gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);gl.depthMask(false);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.enableVertexAttribArray(point);gl.vertexAttribPointer(point,2,gl.FLOAT,false,0,0);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.uniform1i(scene,0);gl.uniform2f(pixel,1/width,1/height);gl.uniform1f(night,nightAmount);gl.drawArrays(gl.TRIANGLES,0,6);gl.depthMask(true);
      },destroy,
    };
  }catch{destroy();return null;}
}
