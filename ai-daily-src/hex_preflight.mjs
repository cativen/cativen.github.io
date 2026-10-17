import {loadLatestHexDaily} from './hex_source.mjs';
const report=await loadLatestHexDaily(new Date());
console.log('[HEX PREFLIGHT] '+JSON.stringify({date:report.date,url:report.url,sections:report.sections.map(s=>({title:s.title,count:s.items.length,hasSourceLinks:s.items.some(i=>i.links.length>0)}))}));
