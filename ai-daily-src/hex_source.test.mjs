import {test} from 'node:test';
import assert from 'node:assert/strict';
import {findDailyLinks,parseDailyArticle} from './hex_source.mjs';
const url='https://hex2077.dev/docs/2026-10/2026-10-17/';
const categories=['产品与功能更新','前沿研究','行业展望与社会影响','开源TOP项目','社媒分享'];
const content=(tag='h3')=>'<html><head><title>AI资讯日报 2026/10/17</title></head><body><nav><h3>站点导航</h3></nav><main><article><div class="page-title">AI资讯日报 2026/10/17</div>'+categories.map((title,i)=>'<'+tag+'>'+title+'</'+tag+'><ol><li>这是一条关于人工智能的产品研究动态，内容由原始报道提供，链接在此：<a href="https://news.example.com/'+i+'">查看报道</a></li><li>另一个不同的行业动态，包含模型更新和相关开源工具。</li></ol>').join('')+'</article></main></body></html>';
test('find canonical HEX links',()=>assert.deepEqual(findDailyLinks('<a href="/docs/2026-10/2026-10-17/">AI资讯日报2026/10/17</a>'),[{date:'2026-10-17',url}]));
for(const level of ['h2','h3']){
 test('extract five sections from '+level+' without h1',()=>{
  const parsed=parseDailyArticle(content(level),url,'2026-10-17');
  assert.equal(parsed.sections.length,5);
  assert.equal(parsed.sections[0].items.length,2);
  assert.equal(parsed.sections[0].items[0].links[0],'https://news.example.com/0');
 });
}
test('reject wrong date',()=>assert.throws(()=>parseDailyArticle(content(),url,'2026-10-18'),/date mismatch/));
test('error reports HTML headings',()=>assert.throws(()=>parseDailyArticle('<html><title>Wrong</title><main>Empty</main></html>',url,'2026-10-17'),/section extraction failed/));

test('associate publisher-hosted screenshots with the previous daily case',()=>{
 const html='<main><article><h2>AI资讯日报 2026/10/17</h2>'+
  categories.map((c,i)=>'<h3>'+c+'</h3><ol><li>这是一条具有具体意义的AI工具案例，介绍产品功能和真实场景。</li></ol><figure><img src="https://source.hex2077.dev/assets/case-'+i+'.png" alt="案例截图 '+i+'"/></figure>').join('')+'</article></main>';
 const parsed=parseDailyArticle(html,url,'2026-10-17');
 assert.equal(parsed.sections.length,5);
 assert.equal(parsed.sections[0].items[0].media.length,1);
 assert.match(parsed.sections[0].items[0].media[0].alt,/案例截图/);
});
test('do not copy third party images without source permissions',()=>{
 const html='<main><article>'+categories.map(c=>'<h3>'+c+'</h3><ol><li>这是一个人工智能案例的示例条目，描述了具体使用场景。</li></ol><img src="https://unapproved.example.com/x.jpg"/>').join('')+'</article></main>';
 const parsed=parseDailyArticle(html,url,'2026-10-17');
 assert.equal(parsed.sections[0].items[0].media.length,0);
});
