import {test} from 'node:test';
import assert from 'node:assert/strict';
import {chooseDailyCover} from './cover.mjs';

const stories=[
 {title:'产品与功能更新',summary:'产品更新改善了开发者实际工作流程',selected:[{excerpt:'产品截图及功能场景'}]},
 {title:'前沿研究',summary:'新的研究提出一项具体方法',selected:[{excerpt:'研究方法可用于实际场景'}]},
 {title:'开源TOP项目',summary:'开发者关注的新开源工具及用法',selected:[]}
];
const a=(u,alt='应用截图')=>({asset:'news-media/'+u+'.jpg',originalUrl:'https://source.hex2077.dev/'+u+'.png',alt,creditUrl:'https://hex2077.dev/docs/2026-10/2026-10-17/'});
test('prefer selected source-backed article screenshots',()=>{
 const cover=chooseDailyCover(stories,[[a('tool')],[a('paper')],[]],'2026-10-17');
 assert.equal(cover.title,'AI日报');
 assert.equal(cover.hasSourceImage,true);
 assert.equal(cover.pictures[0].originalUrl,a('tool').originalUrl);
 assert.equal(cover.pictures.length,2);
 assert.equal(cover.date,'2026-10-17');
 assert.match(cover.hook,/产品更新/);
});
test('do not invent a source image when publisher lacks one',()=>{
 const cover=chooseDailyCover(stories,[[],[],[]],'2026-10-17');
 assert.equal(cover.hasSourceImage,false);
 assert.deepEqual(cover.pictures,[]);
 assert.ok(cover.hook.length>0);
});
test('deduplicate repeated screenshot URLs',()=>{
 const cover=chooseDailyCover(stories,[[a('same')],[a('same')],[a('unique')]],'2026-10-17');
 assert.equal(cover.pictures.length,2);
});
test('demote QR code and avatar pictures',()=>{
 const cover=chooseDailyCover(stories,[[a('qrcode','二维码')],[a('research','论文图')],[]],'2026-10-17');
 assert.equal(cover.pictures[0].originalUrl,a('research').originalUrl);
});
