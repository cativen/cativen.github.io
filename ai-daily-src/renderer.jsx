import React from 'react';
import {registerRoot,Composition,AbsoluteFill,Audio,Img,Sequence,staticFile,useCurrentFrame,useVideoConfig,interpolate,spring} from 'remotion';

const font='"Noto Sans CJK SC","Microsoft YaHei",system-ui,sans-serif';
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'};
const H=1920,W=1080;
const colors=['#5EE7FF','#AB88FF','#73F4C0','#FFC78C','#F68DB4','#81BEFF'];
const part=(v,min,max)=>Math.max(min,Math.min(max,v));
const css={
 pill:{border:'1px solid #5ceeff6b',borderRadius:44,padding:'13px 22px',fontSize:26,fontWeight:800,color:'#94eaf9',background:'#0c294bcc'},
 shadow:{boxShadow:'0 28px 120px #000a'},
};

function Ambient({frame,accent}){
 const drift=interpolate(frame,[0,300],[-50,100],clamp);
 return <AbsoluteFill style={{background:'#070e22',overflow:'hidden'}}>
  <AbsoluteFill style={{background:'radial-gradient(ellipse at 80% 14%,#214ea450,transparent 45%),radial-gradient(ellipse at 0% 82%,#30417c60,transparent 48%),linear-gradient(135deg,#060c1c,#0e1840 62%,#070d20)'}}/>
  <div style={{position:'absolute',width:850,height:850,border:'2px solid #3a69a129',borderRadius:'50%',top:-330,left:510,transform:`translateX(${drift}px)`}}/>
  <div style={{position:'absolute',width:650,height:650,border:'2px solid #547eca16',borderRadius:'50%',bottom:55,left:-360}}/>
  <div style={{position:'absolute',height:9,width:240,background:accent,boxShadow:`0 0 50px ${accent}`,top:110,left:80,borderRadius:8}}/>
 </AbsoluteFill>
}
function Header({scene,date,accent}){
 return <div style={{position:'absolute',top:154,left:80,right:80,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
  <div style={{fontSize:35,fontWeight:950,letterSpacing:3}}>AI<span style={{color:accent}}> / </span>DAILY</div>
  <div style={{color:'#9cbbd9',fontSize:27,fontWeight:700}}>{date}</div>
 </div>
}
function IntroOutro({scene,frame,accent}){
 const fade=interpolate(frame,[0,15,25],[0,0.88,1],clamp),zoom=interpolate(frame,[0,210],[0.91,1.1],clamp);
 const big=scene.kind==='intro';
 return <AbsoluteFill style={{justifyContent:'center',alignItems:'flex-start',padding:'0 86px'}}>
  <div style={{position:'absolute',right:-180,top:390,width:750,height:750,borderRadius:'50%',background:`radial-gradient(circle at 35% 35%,${accent}bb,#1b287680 58%,transparent 72%)`,filter:'blur(13px)',transform:`scale(${zoom})`,opacity:.78}}/>
  <div style={{position:'relative',zIndex:2,opacity:fade}}>
   <div style={{display:'inline-block',...css.pill,marginBottom:50,letterSpacing:6}}>{big?'HEADLINE NEWS / 本期速递':'DAILY WRAP / 今日速递'}</div>
   <div style={{fontWeight:950,fontSize:110,lineHeight:1.24,letterSpacing:-2,textShadow:'0 13px 55px #0008'}}>{scene.title}</div>
   <div style={{height:8,width:230,background:accent,margin:'42px 0',borderRadius:8}}/>
   <div style={{fontSize:46,lineHeight:1.6,color:'#cad7f5',maxWidth:800}}>{scene.summary}</div>
  </div>
  <div style={{position:'absolute',bottom:335,left:86,color:'#829bc8',fontSize:29,letterSpacing:4}}>{big?'01 / 快速了解重点':'SOURCE / 何夕2077 · 原创摘要'}</div>
 </AbsoluteFill>
}
function VisualCard({scene,frame,accent}){
 const images=scene.media||[];
 const duration=Math.max(1,scene.durationFrames||250);
 const chunk=Math.max(85,Math.ceil(duration/Math.max(images.length,1)));
 const n=Math.min(images.length-1,Math.floor(frame/chunk));
 const media=n>=0?images[n]:null;
 const zoom=1+Math.min(0.075,((frame%chunk)/chunk)*0.075);
 const fade=interpolate(frame%chunk,[0,7,12],[0.15,.8,1],clamp);
 const excerpt=(scene.caseExcerpts||[])[Math.min(Math.max(0,n),Math.max(0,(scene.caseExcerpts||[]).length-1))]||scene.summary;
 if(media){
  return <div style={{position:'absolute',top:485,left:70,right:70,height:790,border:'2px solid #ffffff36',borderRadius:30,overflow:'hidden',background:'#0c1633',...css.shadow}}>
   <Img src={staticFile(media.asset)} style={{position:'absolute',width:'100%',height:'100%',objectFit:'cover',filter:'blur(35px) brightness(.4)',transform:'scale(1.25)'}}/>
   <Img src={staticFile(media.asset)} style={{position:'absolute',width:'100%',height:'100%',objectFit:'contain',opacity:fade,transform:`scale(${zoom})`}}/>
   <div style={{position:'absolute',top:24,left:25,display:'flex',gap:12,alignItems:'center'}}>
    <span style={{background:'#080d20e8',padding:'12px 21px',border:'1px solid #85cef7a1',borderRadius:99,color:'#bcefff',fontSize:26,fontWeight:850}}>真实资讯配图</span>
    {images.length>1&&<span style={{background:'#080d20e3',padding:'12px 21px',borderRadius:99,color:'#d5e9ff',fontSize:24}}>{n+1}/{images.length}</span>}
   </div>
   <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'65px 35px 24px',color:'#e1e9fb',background:'linear-gradient(transparent,#070c1bf5)'}}>
    <div style={{fontSize:31,lineHeight:1.35,fontWeight:850,marginBottom:12}}>{excerpt.slice(0,44)}</div>
    <div style={{fontSize:22,color:'#a5c7e0'}}>{media.alt ? ('画面：'+media.alt.slice(0,47)):'图源：何夕2077日报，图片权属归原作者'}</div>
   </div>
  </div>
 }
 // Text/evidence cards stand in for missing or unlicensed screenshots. Never suggest they are actual product UIs.
 const blocks=[{name:'AI NEWS / 资讯聚焦',value:scene.title},{name:'KEY POINT / 核心看点',value:scene.summary},{name:'CASE NOTES / 案例摘要',value:excerpt.slice(0,100)}];
 return <div style={{position:'absolute',top:485,left:70,right:70,height:790,padding:'65px 55px',border:'2px solid #579deb62',borderRadius:30,background:'linear-gradient(140deg,#15264f,#111930 85%)',...css.shadow}}>
   <div style={{fontSize:25,color:accent,letterSpacing:4,fontWeight:900}}>EVIDENCE BRIEF / 原创信息卡</div>
   <div style={{display:'flex',flexDirection:'column',gap:32,marginTop:47}}>
    {blocks.map((b,i)=><div key={i} style={{borderLeft:'6px solid '+(i===1?accent:'#567bb9'),padding:'10px 0 13px 28px',background:'#ffffff06'}}>
     <div style={{fontSize:24,color:'#93b6df',fontWeight:850,letterSpacing:2}}>{b.name}</div>
     <div style={{fontSize:i===0?51:35,lineHeight:1.52,color:'#e2ecff',fontWeight:i===0?900:700,marginTop:10,overflowWrap:'anywhere'}}>{b.value.slice(0,i===0?25:70)}</div>
    </div>)}
   </div>
 </div>
}
function Story({scene,frame,accent}){
 const {fps}=useVideoConfig();
 const reveal=spring({frame,fps,config:{damping:90}});
 const y=interpolate(frame,[0,13],[65,0],clamp);
 const index=String(scene.index).padStart(2,'0');
 return <AbsoluteFill>
  <div style={{position:'absolute',top:262,left:80,right:80,opacity:reveal,transform:`translateY(${y}px)`}}>
   <div style={{display:'flex',alignItems:'center',gap:20,marginBottom:20}}>
    <span style={{...css.pill,borderColor:accent,color:accent}}>TOP {index}</span>
    <span style={{color:'#a7c0df',fontSize:28,fontWeight:850,letterSpacing:2}}>{scene.tag||'AI 动态'}</span>
   </div>
   <div style={{fontSize:76,fontWeight:950,lineHeight:1.22,letterSpacing:-1}}>{scene.title.slice(0,30)}</div>
  </div>
  <VisualCard scene={scene} frame={frame} accent={accent}/>
  <div style={{position:'absolute',top:1310,left:80,right:80,fontSize:40,fontWeight:800,lineHeight:1.5,color:'#e6f0ff',minHeight:160}}>{scene.summary?.slice(0,85)}</div>
  <div style={{position:'absolute',top:1478,left:80,right:80,fontSize:24,color:'#91abd0',fontWeight:700}}>整理：{scene.source||'何夕2077'} · 原创解读</div>
 </AbsoluteFill>
}
function Daily({date,scenes,captions,totalFrames,hasAudio}){
 const frame=useCurrentFrame();const current=scenes.find(s=>frame>=s.startFrame&&frame<s.startFrame+s.durationFrames);
 const cap=captions.find(c=>frame>=c.start&&frame<c.end);
 const colorsIndex=Math.max(0,(current?.index||1)-1)%colors.length,accent=colors[colorsIndex];
 return <AbsoluteFill style={{fontFamily:font,color:'#f5f8ff'}}>
  <Ambient frame={frame} accent={accent}/>
  <Header date={date} scene={current} accent={accent}/>
  {scenes.map((s,i)=><Sequence key={i} from={s.startFrame} durationInFrames={s.durationFrames}>
   <div style={{position:'absolute',inset:0}}>
    {s.kind==='story'?<Story scene={s} frame={Math.max(0,frame-s.startFrame)} accent={colors[Math.max(0,(s.index||1)-1)%colors.length]}/>:<IntroOutro scene={s} frame={Math.max(0,frame-s.startFrame)} accent={accent}/>}
   </div>
  </Sequence>)}
  {cap&&<div style={{position:'absolute',zIndex:11,left:60,right:60,bottom:172,minHeight:105,display:'flex',alignItems:'center',justifyContent:'center',padding:'18px 28px',border:'2px solid #57c4e36c',borderRadius:20,background:'#060b1eef',boxShadow:'0 15px 70px #000b',textAlign:'center',fontSize:43,fontWeight:900,lineHeight:1.44,textShadow:'0 2px 15px #000'}}>
   {cap.text}
  </div>}
  <div style={{position:'absolute',bottom:83,left:80,right:80,height:8,background:'#ffffff32',borderRadius:9}}>
   <div style={{height:'100%',background:'linear-gradient(90deg,#56e1ff,#a478ff)',width:`${part(frame/Math.max(1,totalFrames)*100,0,100)}%`,borderRadius:9}}/>
  </div>
  <div style={{position:'absolute',bottom:43,left:80,right:80,display:'flex',justifyContent:'space-between',color:'#8099be',fontSize:24}}>
   <span>AI DAILY · 新闻解读 / NEWS EXPLAINED</span><span>{Math.floor(frame/30)}s</span>
  </div>
  {hasAudio&&<Audio src={staticFile('narration.wav')}/>}
 </AbsoluteFill>
}
const Root=()=> <Composition id="AiDaily" component={Daily} width={W} height={H} fps={30} durationInFrames={600} defaultProps={{date:'DEMO',scenes:[],captions:[],totalFrames:600,hasAudio:false}} calculateMetadata={({props})=>({durationInFrames:props.totalFrames||600})}/>;
registerRoot(Root);
