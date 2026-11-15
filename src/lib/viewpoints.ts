import type { ObservingPlace } from './locations';
import type { SkyCamera } from './skyView';

export interface NamedViewpoint {
  id:string;cityId:string;city:string;name:string;latitude:number;longitude:number;timeZone:string;
  groundElevation:number;deckHeight:number;eyeHeight:number;
  groundKind:'deck'|'promenade'|'park'|'plaza'|'cliff';camera:SkyCamera;
  description:string;sourceUrl:string;positionSource:string;lookToward:string;accessNote?:string;
}
const camera=(azimuth:number,altitude=12,fieldOfView=100):SkyCamera=>({azimuth,altitude,fieldOfView});
export const VIEWPOINTS:readonly NamedViewpoint[]=[
  {id:'kl-sky-deck',cityId:'kuala-lumpur',city:'Kuala Lumpur',name:'KL Tower · Sky Deck',latitude:3.15293,longitude:101.70386,timeZone:'Asia/Kuala_Lumpur',groundElevation:87,deckHeight:300,eyeHeight:1.7,groundKind:'deck',camera:camera(55,10,95),description:'Stand on the open-air deck above Bukit Nanas, facing the Petronas Twin Towers.',sourceUrl:'https://kltower.com.my/',positionSource:'Estimated northeast deck-edge point near OSM tower node 5839389988; not a surveyed camera pose.',lookToward:'Petronas Twin Towers'},
  {id:'penang-esplanade',cityId:'penang',city:'Penang',name:'Esplanade · George Town waterfront',latitude:5.4215763,longitude:100.3423921,timeZone:'Asia/Kuala_Lumpur',groundElevation:6,deckHeight:0,eyeHeight:1.7,groundKind:'promenade',camera:camera(245,13,105),description:'A waterfront station beside the civic buildings of George Town.',sourceUrl:'https://www.mypenang.gov.my/view_directory.php?id=bmhoU1hTWkZaYW9vMFh4TzdOKzJOUT09',positionSource:'OpenStreetMap Esplanade footway 972732143, node 7651911375; not a surveyed eye position.',lookToward:'George Town civic waterfront'},
  {id:'seoul-namsan',cityId:'seoul',city:'Seoul',name:'Namsan · north plaza lookout',latitude:37.5519388,longitude:126.9885103,timeZone:'Asia/Seoul',groundElevation:260,deckHeight:0,eyeHeight:1.7,groundKind:'plaza',camera:camera(345,11,105),description:'An outdoor plaza viewpoint on Namsan, with the city below and N Seoul Tower behind.',sourceUrl:'https://www.nseoultower.co.kr/eng/global/intro2.asp',positionSource:'OpenStreetMap viewpoint node 3832844678; eye height assumed.',lookToward:'Central Seoul'},
  {id:'sydney-macquaries',cityId:'sydney',city:'Sydney',name:'Mrs Macquarie’s Point · harbour lookout',latitude:-33.8594584,longitude:151.221884,timeZone:'Australia/Sydney',groundElevation:3,deckHeight:0,eyeHeight:1.7,groundKind:'promenade',camera:camera(297,12,100),description:'Look across the harbour toward the Opera House and Harbour Bridge.',sourceUrl:'https://www.botanicgardens.org.au/facility/mrs-macquaries-chair',positionSource:'OpenStreetMap viewpoint node 2386873673, beside Mrs Macquarie’s Chair.',lookToward:'Opera House & Harbour Bridge'},
  {id:'london-primrose',cityId:'london',city:'London',name:'Primrose Hill · summit viewpoint',latitude:51.5395287,longitude:-.1606936,timeZone:'Europe/London',groundElevation:63,deckHeight:0,eyeHeight:1.7,groundKind:'park',camera:camera(130,10,100),description:'A summit view across London, aligned with the mapped southeast sightline.',sourceUrl:'https://www.royalparks.org.uk/visit/parks/regents-park-primrose-hill/primrose-hill',positionSource:'OpenStreetMap viewpoint node 569700954; summit approximately 63 m ASL from Royal Parks.',lookToward:'London skyline'},
  {id:'new-york-pier1',cityId:'new-york',city:'New York',name:'Pier 1 · Granite Prospect',latitude:40.7019951,longitude:-73.9974077,timeZone:'America/New_York',groundElevation:4,deckHeight:0,eyeHeight:1.7,groundKind:'promenade',camera:camera(338,13,105),description:'Stand beside the East River, with Lower Manhattan and the Brooklyn Bridge across the view.',sourceUrl:'https://brooklynbridgepark.org/places-to-see/pier-1/',positionSource:'OpenStreetMap Granite Prospect node 3351167989; terrace height is not surveyed.',lookToward:'Brooklyn Bridge & Lower Manhattan'},
  {id:'atacama-kari',cityId:'atacama',city:'San Pedro de Atacama',name:'Mirador de Kari · virtual lookout',latitude:-22.9169811,longitude:-68.2545001,timeZone:'America/Santiago',groundElevation:2595,deckHeight:0,eyeHeight:1.7,groundKind:'cliff',camera:camera(245,9,105),description:'A terrain-led lookout into the Cordillera de la Sal and the Valley of the Moon.',sourceUrl:'https://valledelaluna.com/en/?wmc-currency=USD',positionSource:'OpenStreetMap Mirador/Piedra del Coyote node 1621464180; nearby Kari location corroborated by geology field guide.',lookToward:'Cordillera de la Sal',accessNote:'Virtual viewpoint. The site operator reported Ckary closed after earthquake assessment; this scene does not imply permission or current access.'},
];
export const viewpointById=(id?:string)=>VIEWPOINTS.find(v=>v.id===id);
export function viewpointPlace(site:NamedViewpoint):ObservingPlace{
  return{id:`viewpoint-${site.id}`,name:site.city==='Penang'?'Penang, Malaysia':site.city==='Kuala Lumpur'?'Kuala Lumpur, Malaysia':site.city,latitude:site.latitude,longitude:site.longitude,elevation:site.groundElevation+site.deckHeight+site.eyeHeight,elevationKnown:false,timeZone:site.timeZone,utcOffset:0,source:'preset',viewpointId:site.id};
}
export function curatedForPlace(place:ObservingPlace):NamedViewpoint|undefined{
  if(place.viewpointId)return viewpointById(place.viewpointId);
  if(place.source==='device'||place.source==='coordinates')return;
  const key=place.name.split(',')[0].toLowerCase().replace(/[^a-z0-9]/g,'');
  const aliases:Record<string,string>={kualalumpur:'kuala-lumpur',kl:'kuala-lumpur',penang:'penang',georgetown:'penang',seoul:'seoul',sydney:'sydney',london:'london',newyork:'new-york',newyorkcity:'new-york',sanpedrodeatacama:'atacama'};
  const site=VIEWPOINTS.find(v=>v.cityId===(place.source==='preset'?place.id:aliases[key]));
  return site&&Math.hypot((place.latitude-site.latitude)*111.32,(place.longitude-site.longitude)*111.32*Math.cos(site.latitude*Math.PI/180))<35?site:undefined;
}
