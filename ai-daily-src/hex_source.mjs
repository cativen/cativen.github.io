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
export function parseDailyArticle(html,url,expectedDate){
 const $=cheerio.load(html);
 const h1=$('h1').filter((_,h)=>/AI资讯日报\s*\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/.test(tidy($(h).text()))).first();
 if(!h1.length)throw Error('No AI资讯日报 heading in article');
 const match=tidy(h1.text()).match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
 if(!match)throw Error('No article date');
 const date=match[1]+'-'+match[2].padStart(2,'0')+'-'+match[3].padStart(2,'0');
 if(expectedDate&&date!==expectedDate)throw Error('Daily date mismatch');
 const root=h1.closest('article').length?h1.closest('article'):h1.closest('main').length?h1.closest('main'):$('body');
 let hs=root.find('h3').toArray();
 if(!hs.some(h=>headings.some(t=>fold($(h).text())===fold(t))))hs=root.find('h2,h3').toArray();
 const sections=[];
 for(let i=0;i<hs.length;i++){
  const title=tidy($(hs[i]).text()).replace(/^#+/,'');
  if(!title||/^(今日摘要|AI资讯日报多渠道|相关文章|回到顶部)/.test(title))continue;
  const entries=[];let n=hs[i].next;
  while(n&&n!==hs[i+1]&&entries.length<30){
   if(n.type==='tag'&&/^h[234]$/.test(n.name))break;
   const target=$(n),lis=target.is('ol,ul')?target.children('li'):target.find('ol,ul').first().children('li');
   lis.each((_,li)=>{
    if(entries.length>=30)return;
    const clone=$(li).clone();clone.find('script,style,img,figure,button').remove();
    const value=tidy(clone.text()).replace(/^\d+[.)、]\s*/,'').slice(0,850);
    if(value.length<16)return;
    const links=[];
    clone.find('a[href]').each((_,a)=>{
     try{const u=new URL($(a).attr('href'),url);if(['http:','https:'].includes(u.protocol)&&u.hostname!=='hex2077.dev'&&!links.includes(u.href))links.push(u.href)}catch{}
    });
    entries.push({id:'I'+(entries.length+1),text:value,links:links.slice(0,3)});
   });
   n=n.next;
  }
  if(entries.length)sections.push({title,items:entries});
 }
 const missing=headings.filter(t=>!sections.some(s=>fold(s.title)===fold(t)));
 if(sections.length<3||missing.length>2)throw Error('HEX section parse failed: '+JSON.stringify({found:sections.map(x=>x.title),missing}));
 return {date,url,sections,title:tidy(h1.text()),missingSections:missing};
}
export async function loadLatestHexDaily(now=new Date()){
 const links=findDailyLinks(await page(SITE+'/docs/'));
 const current=dateKey(now);
 const recent=links.filter(x=>{const n=Math.round((Date.parse(current+'T00:00:00Z')-Date.parse(x.date+'T00:00:00Z'))/86400000);return n>=0&&n<=120});
 if(!recent.length)throw Error('HEX latest archived daily older than 120 days; refuse outdated content');
 const pick=recent[0];
 if(pick.date!==current)console.warn('[HEX] Latest available report is '+pick.date+' (today is '+current+'); video must show source date, not claim current news.');
 const result=parseDailyArticle(await page(pick.url),pick.url,pick.date);
 console.log('[HEX] '+JSON.stringify({date:result.date,url:result.url,sectionSizes:result.sections.map(s=>[s.title,s.items.length])}));
 return result;
}