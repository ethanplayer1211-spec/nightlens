/** Small, bounded GLB geometry reader for the pinned, texture-free NanoRay model. */
export interface LandmarkPrimitive {positions:Float32Array;normals:Float32Array;indices:Uint32Array;color:number[];material:number}
export interface LandmarkModel {primitives:LandmarkPrimitive[];height:number;baseY:number;tips:[number,number,number][];triangles:number}
type Matrix=number[];
const identity=():Matrix=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
const multiply=(a:Matrix,b:Matrix):Matrix=>Array.from({length:16},(_,i)=>{const col=Math.floor(i/4),row=i%4;return [0,1,2,3].reduce((sum,k)=>sum+a[k*4+row]*b[col*4+k],0);});
interface GLTF {asset:{version:string};extensionsRequired?:string[];scene?:number;scenes:{nodes:number[]}[];nodes:{matrix?:number[];children?:number[];mesh?:number;translation?:number[];scale?:number[];rotation?:number[]}[];meshes:{primitives:{attributes:{POSITION:number;NORMAL:number};indices:number;material?:number;mode?:number}[]}[];accessors:{bufferView:number;byteOffset?:number;count:number;componentType:number;type:string;sparse?:unknown}[];bufferViews:{buffer:number;byteOffset?:number;byteLength:number;byteStride?:number}[];materials?:{pbrMetallicRoughness?:{baseColorFactor?:number[]}}[];textures?:unknown[]}
export function decodeLandmarkGLB(input:ArrayBuffer):LandmarkModel{
  const view=new DataView(input);
  if(input.byteLength<28||view.getUint32(0,true)!==0x46546c67||view.getUint32(4,true)!==2||view.getUint32(8,true)!==input.byteLength)throw new Error('Invalid GLB header');
  const jsonLength=view.getUint32(12,true);
  if(view.getUint32(16,true)!==0x4e4f534a||jsonLength>input.byteLength-28)throw new Error('Invalid GLB JSON');
  const data=JSON.parse(new TextDecoder().decode(new Uint8Array(input,20,jsonLength))) as GLTF;
  const binaryHeader=20+jsonLength,binaryStart=binaryHeader+8;
  if(view.getUint32(binaryHeader+4,true)!==0x004e4942||binaryStart+view.getUint32(binaryHeader,true)>input.byteLength||data.extensionsRequired?.length||data.textures?.length)throw new Error('Unsupported model payload');
  const accessor=(id:number,components:number)=>{
    const a=data.accessors[id],b=data.bufferViews[a?.bufferView];
    if(!a||!b||b.buffer!==0||a.sparse||a.count<1||a.count>300000||a.type!==(components===3?'VEC3':'SCALAR'))throw new Error('Unsupported model accessor');
    const size=a.componentType===5126||a.componentType===5125?4:a.componentType===5123?2:a.componentType===5121?1:0;
    if(!size||components===3&&a.componentType!==5126)throw new Error('Unsupported model component');
    const start=binaryStart+(b.byteOffset??0)+(a.byteOffset??0),stride=b.byteStride??size*components;
    if(start+(a.count-1)*stride+size*components>Math.min(input.byteLength,binaryStart+(b.byteOffset??0)+b.byteLength))throw new Error('Model accessor exceeds its buffer');
    return Array.from({length:a.count*components},(_,i)=>{const at=start+Math.floor(i/components)*stride+i%components*size;return a.componentType===5126?view.getFloat32(at,true):size===4?view.getUint32(at,true):size===2?view.getUint16(at,true):view.getUint8(at);});
  };
  const primitives:LandmarkPrimitive[]=[];let triangles=0;
  const visit=(id:number,parent:Matrix,depth:number)=>{
    if(depth>24)throw new Error('Model hierarchy too deep');const node=data.nodes[id];if(!node||node.translation||node.scale||node.rotation)throw new Error('Unsupported model node');
    const local=node.matrix??identity();if(local.length!==16||local.some(v=>!Number.isFinite(v)))throw new Error('Invalid node matrix');
    const m=multiply(parent,local);
    if(node.mesh!==undefined)for(const p of data.meshes[node.mesh].primitives){
      if(p.mode!==undefined&&p.mode!==4)throw new Error('Unsupported model topology');
      const positions=accessor(p.attributes.POSITION,3),normals=accessor(p.attributes.NORMAL,3),indices=accessor(p.indices,1);
      if(positions.length!==normals.length||indices.length%3||indices.some(i=>i>=positions.length/3)||positions.some(v=>!Number.isFinite(v))||normals.some(v=>!Number.isFinite(v)))throw new Error('Invalid model geometry');
      for(let i=0;i<positions.length;i+=3){const v=positions.slice(i,i+3),n=normals.slice(i,i+3);for(let row=0;row<3;row++){positions[i+row]=v[0]*m[row]+v[1]*m[4+row]+v[2]*m[8+row]+m[12+row];normals[i+row]=n[0]*m[row]+n[1]*m[4+row]+n[2]*m[8+row];}const length=Math.hypot(...normals.slice(i,i+3))||1;for(let row=0;row<3;row++)normals[i+row]/=length;}
      triangles+=indices.length/3;if(triangles>100000)throw new Error('Model exceeds geometry budget');
      primitives.push({positions:new Float32Array(positions),normals:new Float32Array(normals),indices:new Uint32Array(indices),material:p.material??0,color:data.materials?.[p.material??0]?.pbrMetallicRoughness?.baseColorFactor??[.6,.6,.6,1]});
    }
    for(const child of node.children??[])visit(child,m,depth+1);
  };
  for(const root of data.scenes[data.scene??0].nodes)visit(root,identity(),0);
  let baseY=Infinity,top=-Infinity;const points:[number,number,number][]=[];
  for(const p of primitives)for(let i=0;i<p.positions.length;i+=3){const y=p.positions[i+1];baseY=Math.min(baseY,y);top=Math.max(top,y);}
  const height=top-baseY;
  if(!(height>100&&height<300))throw new Error('Unexpected source model scale');
  for(const p of primitives)for(let i=0;i<p.positions.length;i+=3)if(p.positions[i+1]>top-height*.001)points.push([p.positions[i],p.positions[i+1],p.positions[i+2]]);
  const mid=(Math.min(...points.map(p=>p[0]))+Math.max(...points.map(p=>p[0])))/2;
  const tips=[points.filter(p=>p[0]<mid),points.filter(p=>p[0]>=mid)].map(group=>[0,1,2].map(i=>group.reduce((sum,p)=>sum+p[i],0)/group.length) as [number,number,number]);
  if(tips.some(p=>p.some(v=>!Number.isFinite(v)))||tips[1][0]-tips[0][0]<20)throw new Error('Source tower centers are invalid');
  return{primitives,height,baseY,tips,triangles};
}
