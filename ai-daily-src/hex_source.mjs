import * as cheerio from 'cheerio';
const SITE='https://hex2077.dev';
const headings=['产品与功能更新','前沿研究','行业展望与社会影响','开源TOP项目','社媒分享'];
const tidy=x=>String(x||'').replace(/\s+/g,' ').trim();
const fold=x=>tidy(x).replace(/[\s_\-]/g,'').toLowerCase();
const dateKey=d=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
async function page(url){
 const target=new URL(url);if(target.hostname!=='hex2077.dev'||target.protocol!=='https:')throw Error('Invalid source host');
 const ctrl=new AbortController(),t=setTimeout(()=>ctrl.abort(),18000);
 try{
  const r=await fetch(target,{signal:ctrl.signal,headers:{'User-Agent':'AI-Daily-Summary/1.0 (+https://github.com/cativen/cativen.github.io)','Accept':'text/html'}});
  if(!r.ok||new URL(r.url).hostname!=='hex2077.dev')throw Error('HEX HTTP '+r.status);
  const s=await r.text();if(s.length>3000000||s.length<100)throw Error('Unexpected HEX HTML size');return s;
 }finally{clearTimeout(t)}
}
export function findDailyLinks(html){
 const $=cheerio.load(html),found=new Map();
 $('a[href]').each((_,a)=>{
  const text=tidy($(a).text());if(!/AI资讯|AI日报/i.test(text))return;
  let url;try{url=new URL($(a).attr('href'),SITE)}catch{return}
  if(url.hostname!=='hex2077.dev')return;
  const match=url.pathname.match(/\/docs\/(\d{4})-(\d{2})\/(\d{4})-(\d{2})-(\d{2})(?:\/|$)/);
  if(!match||match[1]!==match[3]||match[2]!==match[4])return;
  const day=match[1]+'-'+match[2]+'-'+match[5];
  found.set(day,{date:day,url: SITE+url.pathname.replace(/\/?$/,'/')});
 });
 return [...found.values()].sort((a,b)=>b.date.localeCompare(a.date));
}
function sectionFor(text) {
 const label=fold(text);
 return headings.find(h=>label===fold(h)||/^\d+[.、]/.test(tidy(text))&&label.endsWith(fold(h)))||null;
}
export function parseDailyArticle(html,url,expectedDate){
 const $=cheerio.load(html);
 // The verified index link supplies the date; the site's HTML can render its title as h1, h2, or a div.
 const path=new URL(url).pathname.match(/\/docs\/(\d{4})-(\d{2})\/(\d{4})-(\d{2})-(\d{2})(?:\/|$)/);
 if(!path||path[1]!==path[3]||path[2]!==path[4])throw Error('Invalid HEX article URL');
 const date=path[1]+'-'+path[2]+'-'+path[5];
 if(expectedDate&&date!==expectedDate)throw Error('HEX date mismatch: '+date+' != '+expectedDate);
 const roots=[...$('article').toArray(),...$('main').toArray(),...$('body').toArray()];
 const candidates=roots.map(node=>({node,depth:$(node).parents().length,matched:$(node).find('h1,h2,h3,h4,h5').toArray().filter(h=>sectionFor($(h).text())).length}));
 const best=candidates.filter(x=>x.matched>=3).sort((a,b)=>b.depth-a.depth)[0];
 const root=best?$(best.node):$('body');
 const result=new Map();let current=null;
 for(const node of root.find('h1,h2,h3,h4,h5,li,p').toArray()){
  if(/^h[1-5]$/.test(node.name)){
   const t=tidy($(node).text()),c=sectionFor(t);
   if(c){current=c;if(!result.has(c))result.set(c,{title:c,items:[]})}
   else if(/AI资讯日报多渠道|回到顶部|相关阅读|本页目录|评论区/.test(t))current=null;
   continue;
  }
  if(!current)continue;
  if(node.name==='li'&&$(node).parents('li').length)continue;
  if(node.name==='p'&&($(node).closest('li').length||! /^\s*\d+[.)、]/.test($(node).text())))continue;
  const group=result.get(current);if(group.items.length>=30)continue;
  const clone=$(node).clone();clone.find('script,style,img,figure,svg,button').remove();
  const value=tidy(clone.text()).replace(/^\d+[.)、]\s*/,'').slice(0,850);
  if(value.length<16)continue;
  const links=[];
  clone.find('a[href]').each((_,a)=>{try{
   const u=new URL($(a).attr('href'),url);
   if(['https:','http:'].includes(u.protocol)&&u.hostname!=='hex2077.dev'&&!links.includes(u.href))links.push(u.href)
  }catch{}});
  group.items.push({id:'I'+(group.items.length+1),text:value,links:links.slice(0,3)});
 }
 const sections=[...result.values()].filter(x=>x.items.length);
 const missing=headings.filter(h=>!sections.some(s=>s.title===h));
 if(sections.length<3||missing.length>2){
  const hs=$('h1,h2,h3,h4,h5').toArray().map(n=>tidy($(n).text()).slice(0,80)).filter(Boolean);
  throw Error('HEX section extraction failed: '+JSON.stringify({date,url,found:sections.map(s=>[s.title,s.items.length]),missing,htmlTitle:tidy($('title').text()),headings:hs.slice(-35),mainCount:$('main').length,articleCount:$('article').length,listCount:$('li').length}));
 }
 return {date,url,sections,title:'AI资讯日报 '+date.replace(/-/g,'/'),missingSections:missing};
}

export async function loadLatestHexDaily(now=new Date()){
 const links=findDailyLinks(await page(SITE+'/docs/'));
 const current=dateKey(now);
 const recent=links.filter(x=>{const n=Math.round((Date.parse(current+'T00:00:00Z')-Date.parse(x.date+'T00:00:00Z'))/86400000);return n>=0&&n<=7});
 if(!recent.length)throw Error('No HEX daily within 7 days; refuse outdated content');
 const pick=recent[0];
 if(pick.date!==current)console.warn('[HEX] Latest available report is '+pick.date+' (today is '+current+'); video must show source date, not claim current news.');
 const result=parseDailyArticle(await page(pick.url),pick.url,pick.date);
 console.log('[HEX] '+JSON.stringify({date:result.date,url:result.url,sectionSizes:result.sections.map(s=>[s.title,s.items.length])}));
 return result;
}