// Cover art always comes from selected HEX2077 entries when images are available.
// Metadata only: actual source files are provided by news_media.mjs.
const useful=x=>String(x||'').replace(/\s+/g,' ').trim();
const trim=(x,n)=>Array.from(useful(x)).slice(0,n).join('');
function mediaScore(asset,story,index) {
 const alt=useful(asset.alt).toLowerCase();
 const weak=/(logo|二维码|qr.?code|avatar|表情|icon|图标|徽章)/i.test(alt+' '+asset.originalUrl);
 const signal=/(截图|界面|演示|研究|模型|产品|机器人|设备|diagram|demo|chart|screenshot|figure)/i.test(alt);
 const section=/产品与功能/.test(story.title)?20:/前沿研究/.test(story.title)?15:/开源/.test(story.title)?13:8;
 return section+(signal?6:0)+(alt?4:0)-(weak?35:0)-index*3;
}
export function chooseDailyCover(chapters,media,issueDate){
 const candidates=[];
 for(let i=0;i<chapters.length;i++){
  for(let j=0;j<(media[i]||[]).length;j++){
   const asset=media[i][j];
   if(!asset?.asset||!asset.originalUrl)continue;
   candidates.push({asset,story:chapters[i],storyIndex:i,score:mediaScore(asset,chapters[i],i),pictureIndex:j});
  }
 }
 candidates.sort((a,b)=>b.score-a.score);
 const seen=new Set(),chosen=[];
 for(const cand of candidates){
  if(seen.has(cand.asset.originalUrl))continue;
  seen.add(cand.asset.originalUrl);
  chosen.push(cand);
  if(chosen.length===3)break;
 }
 // Use wording from the selected case; do not ask a model to invent a sensational claim.
 const hero=chosen[0]?.story||chapters[0];
 const hook=trim(hero?.summary||hero?.selected?.[0]?.excerpt||'本期值得关注的人工智能动态',23);
 const second=chapters.find(s=>s!==hero)?.summary||'产品 · 研究 · 工具 · 应用';
 const tagline=trim(second,25);
 return {
  title:'AI日报',
  date:issueDate,
  header:'AI DAILY · '+issueDate,
  category:hero?.title||'每日AI资讯速递',
  hook,
  tagline,
  pictures:chosen.map(({asset,story,score})=>({...asset,category:story.title,score})),
  hasSourceImage:chosen.length>0,
  imageCount:chosen.length,
  issueSource:'何夕2077 · 每日AI资讯速递',
 };
}
