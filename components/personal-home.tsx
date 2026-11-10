"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpRight, ArrowRight, X, Menu, Code2, Feather, Heart, Pause, Play, Copy, Check, Mail, MessageCircle } from "lucide-react";
import SoftSculpture from "./soft-sculpture";
import YiyuPreview from "./yiyu-preview";
import { profile } from "@/lib/profile";

const projectNotes = [
  {title:"留住生活的细节", body:"写作、日记、日常规划与情绪记录，在一个安静的空间里慢慢发生。"},
  {title:"让技术贴近人", body:"AI 伙伴与应用能力相连，帮助整理想法，也陪伴日常。"},
  {title:"把选择留给自己", body:"本地优先，能力可以关闭。数据与操作边界被认真对待。"},
];
const topics = [
  {name:"把想法做出来", icon:Code2, description:"一个小念头，怎么变成真正能用的东西？我很愿意聊聊从想法到实现的过程。", prompt:"你最近有什么想做的小东西？"},
  {name:"有温度的设计", icon:Heart, description:"我喜欢那些被认真照顾的细节：恰好的反馈、自然的动效，以及用起来舒服的界面。", prompt:"你用过最贴心的设计是什么？"},
  {name:"一点天马行空", icon:Feather, description:"暂时没有用途的想法也很有意思。保持一点好奇，说不定就能发现新的可能。", prompt:"如果有空，你最想试试什么？"},
];

export default function PersonalHome() {
  const [menuOpen,setMenuOpen]=useState(false);
  const [reduced,setReduced]=useState(false);
  const [topic,setTopic]=useState(0);
  const [time,setTime]=useState("--:--");
  const [copied,setCopied]=useState(false);
  const [copyFailed,setCopyFailed]=useState(false);
  const [active,setActive]=useState("home");
  const contactDialog=useRef<HTMLDialogElement>(null);
  const projectDialog=useRef<HTMLDialogElement>(null);
  const copyTimer=useRef<ReturnType<typeof setTimeout>|null>(null);

  useEffect(()=>{
    const media=window.matchMedia("(prefers-reduced-motion: reduce)");
    const stored=localStorage.getItem("sudeyugan-motion");
    setReduced(stored?stored==="reduced":media.matches);
    const change=()=>{if(!localStorage.getItem("sudeyugan-motion"))setReduced(media.matches);};
    media.addEventListener("change",change);
    const tick=()=>setTime(new Intl.DateTimeFormat("en-GB",{hour:"2-digit",minute:"2-digit",timeZone:"Asia/Shanghai"}).format(new Date()));
    tick(); const clock=setInterval(tick,30000);
    const reveal=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("revealed");reveal.unobserve(entry.target);}});},{threshold:.12});
    document.querySelectorAll("[data-reveal]").forEach(el=>reveal.observe(el));
    const sections=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting)setActive(entry.target.id);});},{rootMargin:"-20% 0px -45% 0px"});
    document.querySelectorAll("main > section[id]").forEach(el=>sections.observe(el));
    return ()=>{clearInterval(clock);if(copyTimer.current)clearTimeout(copyTimer.current);media.removeEventListener("change",change);reveal.disconnect();sections.disconnect();};
  },[]);
  useEffect(()=>{document.documentElement.dataset.motion=reduced?"reduced":"full";},[reduced]);
  useEffect(()=>{
    if(!menuOpen)return;
    document.body.style.overflow="hidden";
    const first=document.querySelector<HTMLAnchorElement>("#mobile-nav a");first?.focus();
    const keydown=(event:KeyboardEvent)=>{
      if(event.key==="Escape"){setMenuOpen(false);document.querySelector<HTMLButtonElement>(".menu-toggle")?.focus();}
      if(event.key==="Tab"){
        const elements=Array.from(document.querySelectorAll<HTMLElement>(".menu-toggle, #mobile-nav a"));
        const index=elements.indexOf(document.activeElement as HTMLElement);
        if(event.shiftKey&&index===0){event.preventDefault();elements.at(-1)?.focus();}
        else if(!event.shiftKey&&index===elements.length-1){event.preventDefault();elements[0]?.focus();}
      }
    };
    document.addEventListener("keydown",keydown);
    return()=>{document.body.style.overflow="";document.removeEventListener("keydown",keydown);};
  },[menuOpen]);
  const toggleMotion=()=>setReduced(value=>{localStorage.setItem("sudeyugan-motion",value?"full":"reduced");return !value;});
  const copyWechat=async()=>{try{await navigator.clipboard.writeText(profile.wechat);setCopied(true);setCopyFailed(false);if(copyTimer.current)clearTimeout(copyTimer.current);copyTimer.current=setTimeout(()=>setCopied(false),2400);}catch{setCopyFailed(true);}};
  const nav=[{id:"about",label:"关于我"},{id:"work",label:"做过的事"},{id:"connect",label:"认识一下"}];

  return <>
    <a href="#main" className="skip-link">跳转到内容</a>
    <header className="site-header"><div className="header-inner">
      <a className="wordmark" href="#home" aria-label="苏的鱼干，回到首页"><span className="fish-mark" aria-hidden="true"><i/><b/></span>{profile.name}<span className="wordmark-dot">.</span></a>
      <nav className="desktop-nav" aria-label="主导航">{nav.map(item=><a href={`#${item.id}`} key={item.id} aria-current={active===item.id?"location":undefined}>{item.label}<span/></a>)}</nav>
      <div className="header-right"><span className="open-to-talk"><i/> 很高兴遇见你</span><button className="menu-toggle" aria-label={menuOpen?"关闭导航":"打开导航"} aria-expanded={menuOpen} aria-controls="mobile-nav" onClick={()=>setMenuOpen(!menuOpen)}>{menuOpen?<X size={23}/>:<Menu size={23}/>}</button></div>
    </div></header>
    {menuOpen&&<nav className="mobile-nav" id="mobile-nav" aria-label="移动端导航" onKeyDown={e=>{if(e.key==="Escape")setMenuOpen(false);}}>{nav.map((item,i)=><a href={`#${item.id}`} key={item.id} onClick={()=>setMenuOpen(false)}><span>0{i+1}</span>{item.label}<ArrowUpRight/></a>)}<p>保持温柔，持续好奇。</p></nav>}

    <main id="main">
      <section className="hero page-width" id="home" aria-labelledby="hero-title">
        <div className="hero-topline"><span><span className="small-cross">✳</span> 你好，我是{profile.name}</span><span className="mono">PERSONAL WEBSITE / VOL. 01</span></div>
        <div className="hero-main"><div className="hero-copy"><h1 id="hero-title"><span className="line-mask"><span>保持温柔，</span></span><span className="line-mask blue"><span>持续好奇<span className="hero-period">。</span></span></span></h1><div className="hero-handwritten">a soft heart, a curious mind.</div><p className="hero-description">写代码，也关心代码之外的事。<br/>喜欢让想法落地，也想让日常多一点意思。</p><a href="#work" className="text-link hero-link">看看我做的东西 <span className="round-arrow"><ArrowDown size={17}/></span></a></div><div className="hero-art"><SoftSculpture reduced={reduced}/><span className="art-caption mono"><span className="caption-dot"/> MADE OF CURIOSITY</span><span className="art-coordinate mono">X 0.24<br/>Y 0.86</span></div></div>
        <div className="hero-bottom"><a href="#about" className="scroll-cue"><span className="scroll-line"/>慢慢往下看 <ArrowDown size={12}/></a><span>技术里有逻辑，生活里有温度。</span><span className="mono">SCROLL TO EXPLORE</span></div>
      </section>

      <section className="about-section page-width section-space" id="about" aria-labelledby="about-title">
        <div className="section-label" data-reveal><span className="mono">01 / ABOUT ME</span><span>认识我的另一面</span></div>
        <div className="about-grid"><div className="about-title" data-reveal><h2 id="about-title">有一点温柔。<br/>也有一点，<br/><span>不安分的好奇心。</span></h2><div className="about-doodle" aria-hidden="true"><svg viewBox="0 0 150 66"><path d="M8 33C28 5 58 5 68 28S34 68 35 40s64-38 75-6c8 25-13 29-12 8s24-23 39-19M126 12l13 10-16 12"/></svg><span>still figuring things out</span></div></div><div className="about-copy" data-reveal><span className="about-hello">很高兴，在这里遇见你。</span><p>有些人觉得我挺温柔的。<br/>我也希望你能发现，我还有有趣、爱折腾的一面。</p><p>我喜欢把脑海里的想法，一点一点做成能用的东西。从一行代码，到一个界面，再到那些容易被忽略的小细节。</p><p>像「一隅」这样的作品，是我认识世界、表达自己的方式。也希望这些片段，能成为我们认识的开始。</p><div className="personality-tags"><span><span className="tiny-dot"/> 温柔是底色</span><span>好奇心在线 ↗</span><span>想法正在运行 <span className="blinking-cursor">_</span></span></div></div></div>
        <div className="values-row" data-reveal><span><Heart size={16}/>感受细节</span><span><Code2 size={17}/>认真创造</span><span><Feather size={16}/>保持一点自由</span><span className="mono values-end">A WORK IN PROGRESS, ALWAYS.</span></div>
      </section>

      <section className="work-section section-space" id="work" aria-labelledby="work-title"><div className="page-width"><div className="section-label" data-reveal><span className="mono">02 / SELECTED WORK</span><span>让想法，真的发生</span></div><div className="section-heading" data-reveal><h2 id="work-title">把在意的事，<br/>做成作品<span className="orange-period">。</span></h2><p>技术是实现的方式，<br/>想带来的感受，是开始的理由。</p></div>
        <div className="project-stage" data-reveal><div className="project-stage-top"><span className="project-index mono">SELECTED PROJECT — 001</span><span className="project-live"><i/> 可以直接试试</span></div><div className="project-stage-body"><div className="project-intro"><span className="project-chinese-mark">隅<span>YIYU</span></span><h3>一隅 <span>Yiyu</span></h3><p>给日常，留一个<br/>温暖的数字角落。</p><div className="project-mini-line"/><span className="project-platform mono">DESKTOP APP<br/>LOCAL-FIRST · HUMAN-CENTERED</span></div><div className="demo-wrapper"><YiyuPreview/></div></div><div className="project-stage-footer"><span><span className="small-cross">✳</span> 为普通的每一天而设计</span><span>试着切换右侧界面，或记下一句话 <ArrowUpRight size={13}/></span></div></div>
        <div className="project-details" data-reveal><div><h3>一隅 / 一个属于自己的空间</h3><p>写作、规划、情绪记录与 AI 伙伴，在这里相遇。<br/>从界面到本地数据，再到 AI 能力，认真照顾每一层体验。</p><div className="tech-tags">{["React","TypeScript","Tauri","Rust","SQLite","AI Agent"].map(tech=><span key={tech}>{tech}</span>)}</div></div><button className="text-link" onClick={()=>projectDialog.current?.showModal()}>了解这个作品 <span className="round-arrow"><ArrowUpRight size={17}/></span></button></div>
        <div className="project-notes" data-reveal>{projectNotes.map((item,i)=><div key={item.title}><span className="mono">0{i+1}</span><h4>{item.title}</h4><p>{item.body}</p></div>)}</div>
      </div></section>

      <section className="topics-section page-width section-space" aria-labelledby="topics-title"><div className="section-label" data-reveal><span className="mono">03 / COMMON GROUND</span><span>也许，我们聊得来</span></div><div className="topics-grid"><div data-reveal><h2 id="topics-title">从一个共同话题<br/>开始<span className="blue">认识</span>吧。</h2><p className="topics-lead">不必准备一个很正式的开场。<br/>一个问题、一个想法，都很好。</p><div className="topic-tabs" role="tablist" aria-label="可以聊的话题">{topics.map((item,i)=>{const Icon=item.icon;return <button key={item.name} id={`topic-tab-${i}`} role="tab" aria-selected={topic===i} aria-controls="topic-panel" tabIndex={topic===i?0:-1} className={topic===i?"selected":""} onClick={()=>setTopic(i)} onKeyDown={e=>{if(e.key==="ArrowRight"||e.key==="ArrowLeft"){e.preventDefault();const next=(i+(e.key==="ArrowRight"?1:2))%3;setTopic(next);document.getElementById(`topic-tab-${next}`)?.focus();}}}><Icon size={16}/>{item.name}<ArrowUpRight size={14}/></button>;})}</div></div><div className="topic-card" data-reveal><span className="quote-mark" aria-hidden="true">“</span><div id="topic-panel" role="tabpanel" aria-labelledby={`topic-tab-${topic}`} key={topic} className="topic-content"><span className="mono">A CONVERSATION STARTER</span><p>{topics[topic].description}</p><div className="topic-prompt">{topics[topic].prompt}</div></div><span className="topic-card-signature">— 苏的鱼干</span><span className="topic-card-star" aria-hidden="true">✳</span></div></div></section>

      <section className="connect-section" id="connect" aria-labelledby="connect-title"><div className="page-width"><div className="section-label" data-reveal><span className="mono">04 / SAY HELLO</span><span><span className="tiny-dot"/> 总有新的相遇</span></div><div className="connect-content" data-reveal><p>如果你也喜欢认真创造，随意聊天。</p><h2 id="connect-title">很高兴，<br/>我们<span>不止路过</span><span className="orange-period">。</span></h2><button className="contact-button" onClick={()=>contactDialog.current?.showModal()}><span>认识一下</span><ArrowUpRight size={29}/></button><span className="connect-note">可以聊技术，聊想法，或者只是打个招呼。</span></div><div className="connect-watermark" aria-hidden="true">hello, you.</div></div></section>
    </main>

    <footer className="site-footer page-width"><a className="footer-name" href="#home">{profile.name}<span>© {new Date().getFullYear()}</span></a><span className="footer-clock"><span className="tiny-dot"/>{time} CST <span>·</span> 此刻也是好时候</span><div className="footer-actions"><button onClick={toggleMotion} aria-pressed={reduced}>{reduced?<Play size={12}/>:<Pause size={12}/>} {reduced?"开启动效":"减弱动效"}</button><a href="#home" aria-label="回到顶部"><ArrowUp size={16}/></a></div></footer>

    <dialog className="contact-dialog" aria-labelledby="contact-dialog-title" ref={contactDialog} onClick={e=>{if(e.target===e.currentTarget)contactDialog.current?.close();}}><button className="dialog-close" aria-label="关闭联系方式" onClick={()=>contactDialog.current?.close()}><X size={21}/></button><span className="mono dialog-eyebrow">NICE TO MEET YOU</span><h2 id="contact-dialog-title">你好，新朋友<span className="orange-period">。</span></h2><p>很高兴你愿意认识我。<br/>从一句简单的「你好」开始就好。</p><div className="contact-list"><div><span><MessageCircle size={18}/>微信</span>{profile.wechat?<button className="copy-contact" onClick={copyWechat}>{profile.wechat}{copied?<Check size={15}/>:<Copy size={15}/>}</button>:<span className="contact-pending">稍后补上</span>}</div><div><span><Mail size={18}/>邮箱</span>{profile.email?<a href={`mailto:${profile.email}`}>{profile.email}<ArrowUpRight size={15}/></a>:<span className="contact-pending">稍后补上</span>}</div><div><span><Code2 size={18}/>GitHub</span>{profile.github?<a href={profile.github} target="_blank" rel="noreferrer">去看看<ArrowUpRight size={15}/></a>:<span className="contact-pending">稍后补上</span>}</div></div><span className="contact-footnote" role="status">{copyFailed?`可以手动复制微信号：${profile.wechat}`:copied?"微信号已复制，期待认识你。":"联系方式还在整理，先记住「苏的鱼干」吧。"}</span></dialog>

    <dialog className="project-dialog" aria-labelledby="project-dialog-title" ref={projectDialog} onClick={e=>{if(e.target===e.currentTarget)projectDialog.current?.close();}}><button className="dialog-close" aria-label="关闭作品介绍" onClick={()=>projectDialog.current?.close()}><X size={21}/></button><span className="mono dialog-eyebrow">SELECTED WORK / YIYU</span><h2 id="project-dialog-title">一隅<span className="project-modal-en"> Yiyu</span></h2><p className="project-dialog-subtitle">安静、温暖、本地优先的个人数字空间。</p><div className="project-dialog-intro">把长期写作、日常规划、情绪记录和可交互的 AI 桌面伙伴放在一起。让丰富的能力，服务于简单、自然的日常。</div><div className="project-modal-facts"><div><span>平台</span><strong>Windows 桌面应用</strong></div><div><span>技术</span><strong>React · Tauri · Rust · SQLite</strong></div><div><span>理念</span><strong>本地优先，边界清晰</strong></div></div><div className="project-modal-notes">{projectNotes.map((item,i)=><article key={item.title}><span className="mono">0{i+1}</span><div><h3>{item.title}</h3><p>{item.body}</p></div></article>)}</div><p className="project-dialog-note">主页内为基于真实功能设计的独立交互演示，不连接一隅的私人数据，也不调用 AI 服务。</p><button className="text-link" onClick={()=>{projectDialog.current?.close();document.querySelector(".yiyu-demo")?.scrollIntoView({behavior:reduced?"instant":"smooth",block:"center"});}}>回去试试演示 <ArrowRight size={17}/></button></dialog>
  </>;
}
