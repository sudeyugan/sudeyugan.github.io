"use client";

import { useState } from "react";
import { Feather, BookOpen, Sparkles, Sun, ArrowUpRight, Check } from "lucide-react";

const tabs = ["日常", "写作", "伙伴"] as const;
type Tab = typeof tabs[number];

export default function YiyuPreview() {
  const [tab, setTab] = useState<Tab>("日常");
  const [mood, setMood] = useState("平静");
  const [note, setNote] = useState("那些微小的、值得记住的瞬间。\n\n也许，写下来就不会忘记。");
  return <div className="yiyu-demo" aria-label="一隅界面交互演示">
    <div className="demo-titlebar"><span className="window-dots"><i/><i/><i/></span><span>一隅 · Yiyu</span><span className="demo-label">交互演示</span></div>
    <div className="demo-body">
      <aside className="demo-sidebar"><span className="demo-logo"><Feather size={19}/>一隅</span><span className="demo-sidebar-caption">属于你的数字空间</span><div role="tablist" aria-label="一隅演示页面">{tabs.map((item,i)=>{const Icon=[Sun,BookOpen,Sparkles][i];return <button id={`demo-tab-${item}`} aria-controls="demo-panel" role="tab" aria-selected={tab===item} tabIndex={tab===item?0:-1} className={tab===item?"selected":""} key={item} onClick={()=>setTab(item)} onKeyDown={e=>{if(e.key==="ArrowRight"||e.key==="ArrowDown"||e.key==="ArrowLeft"||e.key==="ArrowUp"){e.preventDefault();const next=tabs[(i+(e.key==="ArrowRight"||e.key==="ArrowDown"?1:2))%3];setTab(next);document.getElementById(`demo-tab-${next}`)?.focus();}}}><Icon size={15}/>{item}</button>;})}</div><span className="demo-sidebar-bottom"><span className="tiny-dot"/> 本地优先 · 安心记录</span></aside>
      <div className="demo-content" id="demo-panel" role="tabpanel" aria-labelledby={`demo-tab-${tab}`}>
        {tab==="日常"&&<div className="demo-view" key="daily"><span className="demo-eyebrow"><Sun size={12}/> 一个平常，也珍贵的日子</span><h3>欢迎回到一隅</h3><p>不必追赶时间，先照顾一下自己。</p><div className="demo-question"><span>留一个问题，与今天同行 <ArrowUpRight size={12}/></span><strong>最近，有什么小事让你觉得<br/>生活还不错？</strong><span className="demo-question-line"/></div><div className="mood-heading"><span>此刻的心情</span><span>点一下，留住此刻</span></div><div className="mood-options">{["平静","开心","疲惫","期待"].map((item,i)=><button key={item} aria-pressed={mood===item} onClick={()=>setMood(item)} className={mood===item?"active":""}><span style={{background:["#bbc7ab","#e8c789","#bbc5d7","#d9b2a1"][i]}}>{mood===item?<Check size={11}/>:null}</span>{item}</button>)}</div></div>}
        {tab==="写作"&&<div className="demo-view" key="writing"><span className="demo-eyebrow"><Feather size={12}/> 给想法，一个停靠的地方</span><h3>空白也有可能</h3><p>从一句话开始，慢慢写就好。</p><label className="demo-editor-label" htmlFor="demo-note">一页小记 <span>仅作体验，刷新后清空</span></label><textarea id="demo-note" value={note} onChange={e=>setNote(e.target.value)} maxLength={1200} spellCheck={false}/><span className="demo-word-count">{note.replace(/\s/g,"").length} 字 · 此刻的灵感</span></div>}
        {tab==="伙伴"&&<div className="demo-view companion-demo" key="companion"><span className="demo-eyebrow"><Sparkles size={12}/> 陪伴，也可以很轻盈</span><div className="companion-face"><span/><span/><i/></div><h3>我在，慢慢来。</h3><p>记下今天，或者继续那个还没完成的想法。</p><div className="companion-bubble">真实应用支持 AI 对话与桌面伙伴。<br/>这里展示一隅的陪伴理念。</div></div>}
      </div>
    </div>
  </div>;
}
