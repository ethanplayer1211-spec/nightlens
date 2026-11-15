import {ArrowUpRight} from 'lucide-react';

import {PLACE_PHOTOS as photographs} from '../lib/placePhotos';

export default function PlaceReference({id,onEnter}:{id?:string;onEnter:()=>void}){
  const photo=photographs[id as keyof typeof photographs];
  if(!photo)return null;
  const embedded=document.getElementById(photo.embedded)?.getAttribute('src');
  return <section className="place-reference experience-reveal is-revealed" aria-labelledby="place-reference-heading"><div className="place-reference-heading"><span className="eyebrow">A PLACE WITH A REFERENCE</span><h2 id="place-reference-heading">Recognize the place.<br/><em>Question the picture.</em></h2><div><p>A source photograph gives the reconstruction something real to answer to. The simulated view uses mapped geometry and a calculated sky; fine architectural detail remains approximate.</p><button onClick={onEnter}>Return to the calculated sky <ArrowUpRight size={16}/></button></div></div><figure><img src={embedded??`/data/realism/${photo.file}`} loading="lazy" alt={`Historical source photograph of ${photo.place}, by ${photo.author}. It is a reference, not the simulated sky.`}/><figcaption><span>{photo.note}</span><span>Photo: <a href={photo.url} target="_blank" rel="noreferrer">{photo.author}</a> · <a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.license}</a>. Unretouched source thumbnail.</span></figcaption></figure></section>;
}
