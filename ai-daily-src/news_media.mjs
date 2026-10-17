import fs from 'node:fs/promises';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';

const exec=promisify(execFile);
const allow=new Set(['source.hex2077.dev','hex2077.dev']);
export function approvedImageUrl(value){
 try{
  const u=new URL(value);
  return u.protocol==='https:'&&allow.has(u.hostname)&&/\.(png|jpg|jpeg|webp|avif|gif)$/i.test(u.pathname);
 }catch{return false}
}
async function saveImage(meta,output,idx){
 if(!approvedImageUrl(meta.url))throw Error('Media host/type not allowed');
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),18000);
 let resp;
 try{
  resp=await fetch(meta.url,{signal:ctrl.signal,headers:{Accept:'image/jpeg,image/png,image/webp,image/avif,image/gif'}});
  if(!resp.ok||!approvedImageUrl(resp.url))throw Error('Media download blocked: HTTP '+resp.status);
  const len=Number(resp.headers.get('content-length')||0);
  if(len>9_000_000)throw Error('Image larger than 9 MB');
  const mime=(resp.headers.get('content-type')||'').split(';')[0].trim();
  if(!/^image\/(png|jpeg|webp|gif|avif)$/.test(mime))throw Error('Wrong media content-type '+mime);
  const array=new Uint8Array(await resp.arrayBuffer());
  if(array.length<350||array.length>9_000_000)throw Error('Media byte size invalid');
  const raw=path.join(output,'incoming_'+idx+path.extname(new URL(meta.url).pathname).toLowerCase());
  // Reject tiny logos/icons before upscaling them into a prominent cover photograph.
  let dimensions={width:0,height:0};
  const jpg=path.join(output,'news_'+idx+'.jpg');
  await fs.writeFile(raw,array);
  try{
   const probe=await exec('ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','csv=p=0:s=x',raw],{timeout:15000});
   const [width,height]=(probe.stdout||'').trim().split('x').map(Number);
   if(!Number.isFinite(width)||!Number.isFinite(height)||width<280||height<220||width*height<115000)throw Error('Screenshot too small for video');
   dimensions={width,height};
   await exec('ffmpeg',['-v','error','-y','-i',raw,'-frames:v','1','-vf','scale=960:1100:force_original_aspect_ratio=decrease','-q:v','4',jpg],{timeout:45000});
   if((await fs.stat(jpg)).size<700)throw Error('Invalid image conversion');
  }finally{await fs.rm(raw,{force:true})}
  return {asset:'news-media/news_'+idx+'.jpg',originalUrl:meta.url,alt:meta.alt||'',width:dimensions.width,height:dimensions.height,creditUrl:meta.creditUrl,credit:'图源：何夕2077日报（原图权属归原作者）'};
 }finally{clearTimeout(timer)}
}
export async function prepareStoryAssets(stories,publicDir){
 const folder=path.join(publicDir,'news-media');await fs.rm(folder,{recursive:true,force:true});await fs.mkdir(folder,{recursive:true});
 const result=[];let count=0;
 for(const s of stories){
  const candidates=[...new Map((s.selected||[]).flatMap(x=>x.media||[]).filter(x=>approvedImageUrl(x.url)).map(x=>[x.url,x])).values()].slice(0,2);
  const media=[];
  for(const m of candidates){
   try{media.push(await saveImage(m,folder,count++))}
   catch(e){console.warn('[MEDIA] Skip '+m.url.slice(0,150)+': '+e.message)}
  }
  result.push(media);
  console.log('[MEDIA] '+s.title+': '+media.length+' image(s) from '+candidates.length+' candidate(s)');
 }
 return result;
}
