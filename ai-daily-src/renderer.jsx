import React from 'react';
import {registerRoot,Composition,AbsoluteFill,Audio,Sequence,staticFile,useCurrentFrame,useVideoConfig,interpolate,spring} from 'remotion';
const font='"Noto Sans CJK SC","Microsoft Yahei",sans-serif';
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'};
function Slide({scene,date}) {
 const frame=useCurrentFrame(),{fps}=useVideoConfig();
 const scale=spring({frame,fps,config:{damping:100}});
 const y=interpolate(frame,[0,30],[80,0],clamp);
 const k=scene.kind==='story';
 return <AbsoluteFill style={{padding:'300px 90px 320px',display:'flex',justifyContent:'center',gap:36,color:'#f5f8ff',fontFamily:font}}>
  <div style={{fontSize:28,color:'#73e8fa',letterSpacing:3}}>{scene.tag||'AI DAILY'} <span style={{color:'#8e9dbe',marginLeft:18}}>{date}</span></div>
  {k&&<div style={{fontSize:145,color:'#80e1ff',fontWeight:950,lineHeight:1,opacity:scale}}>0{scene.index}</div>}
  <div style={{fontSize:k?86:106,fontWeight:950,lineHeight:1.25,opacity:scale,transform:`translateY(${y}px)`,overflowWrap:'anywhere'}}>{scene.title}</div>
  <div style={{width:150,height:7,borderRadius:9,background:'linear-gradient(90deg,#47eaff,#9a83ff)'}}/>
  <div style={{fontSize:43,lineHeight:1.6,color:'#c3d5ed'}}>{scene.summary}</div>
  {scene.source&&<div style={{fontSize:25,color:'#93b4d7',marginTop:36}}>来源：{scene.source}</div>}
 </AbsoluteFill>
}
function Daily({date,scenes,captions,totalFrames,hasAudio}){
 const frame=useCurrentFrame(),{width}=useVideoConfig();
 const cap=captions.find(c=>frame>=c.start&&frame<c.end);
 return <AbsoluteFill style={{background:'#080e20',fontFamily:font,color:'white',overflow:'hidden'}}>
  <AbsoluteFill style={{background:'radial-gradient(circle at 70% 15%,#243f7766,transparent 48%),radial-gradient(circle at 0% 80%,#146a7750,transparent 45%),linear-gradient(150deg,#0b1936,#0b1027 70%)'}}/>
  <div style={{position:'absolute',left:75,right:75,top:112,height:3,background:'linear-gradient(90deg,#40dcf8,transparent)'}}/>
  <div style={{position:'absolute',top:154,left:88,color:'#82edff',fontSize:35,fontWeight:900,letterSpacing:5}}>AI / DAILY</div>
  <div style={{position:'absolute',top:159,right:90,color:'#92a2c2',fontSize:24}}>NEWS BRIEFING</div>
  {scenes.map((s,i)=><Sequence key={i} from={s.startFrame} durationInFrames={s.durationFrames}><Slide scene={s} date={date}/></Sequence>)}
  {cap&&<div style={{position:'absolute',zIndex:10,left:60,right:60,bottom:230,display:'flex',justifyContent:'center',padding:'24px 27px',border:'1px solid #39d8ef55',borderRadius:19,background:'#06152ddb',textAlign:'center',fontSize:47,fontWeight:850,lineHeight:1.5}}>{cap.text}</div>}
  <div style={{position:'absolute',bottom:115,left:88,right:88,background:'#ffffff30',height:8,borderRadius:9}}>
    <div style={{width:`${Math.min(100,frame/Math.max(1,totalFrames)*100)}%`,background:'linear-gradient(90deg,#47e6fa,#b386ff)',height:'100%',borderRadius:9}}/>
  </div>
  <div style={{position:'absolute',bottom:66,left:88,right:88,display:'flex',justifyContent:'space-between',fontSize:25,color:'#92a5c7'}}><span>AI · MODELS · AGENTS · DEV</span><span>DAILY EDITION</span></div>
  {hasAudio&&<Audio src={staticFile('narration.wav')}/>}
 </AbsoluteFill>
}
const Root=()=> <Composition id="AiDaily" component={Daily} width={1080} height={1920} fps={30} durationInFrames={600} defaultProps={{date:'DEMO',scenes:[],captions:[],totalFrames:600,hasAudio:false}} calculateMetadata={({props})=>({durationInFrames:props.totalFrames||600})}/>;
registerRoot(Root);
