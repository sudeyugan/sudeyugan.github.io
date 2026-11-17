/* Two invitations: a ceremonial lot and an adaptive, visual-only comparison. */
(() => {
  'use strict';
  const D=window.CONNECTION_DATA,T=window.ConnectionTest;
  const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
  const column=(tag,text,cls)=>{const n=el(tag,undefined,cls);n.setAttribute('aria-label',text);for(const [i,char]of [...text].entries()){const glyph=el('span',char);glyph.style.setProperty('--glyph',i);glyph.setAttribute('aria-hidden','true');n.append(glyph);}return n;};
  const button=(text,cls,fn)=>{const b=el('button',text,cls);b.type='button';b.addEventListener('click',fn);return b;};
  window.ContactMatch=class {
    constructor(isReduced){
      Object.assign(this,{isReduced,scene:document.querySelector('#scene-contact'),active:false,mode:'match',phase:'welcome',fortunePhase:'idle',history:[],answers:{},cursor:0,limit:T.settings.initial,holdFrame:0,holding:false,advanceTimer:0,answerPending:false});
      this.panel=this.scene.querySelector('.match-content');this.stage=this.scene.querySelector('.match-stage');this.status=this.scene.querySelector('.meet-status');
      this.art=new MatchArt(this.scene.querySelector('.match-art'),isReduced,fraction=>{const n=this.panel.querySelector('.match-score-number');if(n&&this.result?.score!=null)n.textContent=String(Math.round(this.result.score*100*fraction));const result=this.panel.querySelector('.frequency-result');result?.style.setProperty('--reveal',String(fraction));});
      this.scene.querySelector('.meet-qq').addEventListener('click',()=>this.copy(D.profile.qq));this.updateContacts();
      this.tabs=[...this.scene.querySelectorAll('[data-meet-mode]')];this.tabs.forEach((tab,i)=>{
        tab.addEventListener('click',()=>this.switchMode(tab.dataset.meetMode));
        tab.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?1:1-i;this.switchMode(this.tabs[next].dataset.meetMode);this.tabs[next].focus({preventScroll:true});});
      });
      document.addEventListener('keydown',e=>{
        if(!this.active||this.answerPending||e.repeat||this.mode!=='match'||this.phase!=='question'||e.ctrlKey||e.metaKey||e.altKey||e.target.closest('input,textarea,select'))return;
        const q=this.history[this.cursor],i=Number(e.key)-1;
        if(/^[1-4]$/.test(e.key)&&i<q.options.length){e.preventDefault();this.choose(q.options[i].id);this.panel.querySelectorAll('.match-option')[i].focus({preventScroll:true});}
        if(e.key==='Enter'&&e.target.closest('.match-option')&&Object.hasOwn(this.answers,q.id)){e.preventDefault();this.next();}
      });
      addEventListener('site:motion',()=>this.updateMotionControls());addEventListener('blur',()=>this.cancelHold());document.addEventListener('visibilitychange',()=>{if(document.hidden){this.cancelHold();this.cancelAdvance();}});this.render();
    }
    visible(id){this.active=id==='contact';this.art.setActive(this.active);this.ritual?.setActive(this.active&&this.mode==='fortune'&&this.fortunePhase!=='revealed');if(!this.active){this.cancelAdvance();this.cancelHold();if(this.fortunePhase==='drawing'){clearTimeout(this.drawTimer);this.fortunePhase='idle';this.render();}}}
    updateContacts(){this.scene.querySelector('.contact-label').textContent='找到'+D.profile.name;this.scene.querySelector('.meet-qq strong').textContent=D.profile.qq;this.scene.querySelector('.meet-steam').href=D.profile.steam;}
    async copy(text){let done=false;try{await navigator.clipboard.writeText(text);done=true;}catch{const field=el('textarea');field.value=text;field.style.cssText='position:fixed;left:-9999px';document.body.append(field);field.select();try{done=document.execCommand('copy');}catch{}field.remove();}this.status.textContent=done?'QQ 号码已复制。':'QQ：'+text;clearTimeout(this.statusTimer);this.statusTimer=setTimeout(()=>this.status.textContent='',6000);}
    switchMode(mode){if(mode===this.mode)return;this.cancelAdvance();this.cancelHold();clearTimeout(this.drawTimer);if(this.fortunePhase==='drawing')this.fortunePhase='idle';this.mode=mode;this.render();}
    render(focus=false){
      this.cancelAdvance();this.cancelHold();this.ritual?.setActive(false);this.panel.replaceChildren();this.stage.scrollTop=0;this.stage.dataset.experience=this.mode;this.stage.dataset.phase=this.mode==='fortune'?this.fortunePhase:this.phase;
      this.stage.setAttribute('aria-labelledby','meet-tab-'+this.mode);
      this.tabs?.forEach(tab=>{const selected=tab.dataset.meetMode===this.mode;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;});
      if(this.mode==='fortune'){if(this.fortunePhase==='revealed')this.fortuneResult();else this.fortuneWelcome();}
      else if(this.phase==='welcome')this.welcome();else if(this.phase==='question')this.question();else this.showResult();
      if(!this.isReduced()&&this.mode==='fortune'&&this.fortunePhase!=='revealed')this.panel.firstElementChild?.animate([{opacity:0,transform:'translateY(15px)'},{opacity:1,transform:'translateY(0)'}],{duration:650,easing:'cubic-bezier(.16,1,.3,1)'});
      if(focus){const title=this.panel.querySelector('h3');title?.setAttribute('tabindex','-1');title?.focus({preventScroll:true});}
    }
    fortuneWelcome(){
      const box=el('div',undefined,'fortune-welcome'),copy=el('div',undefined,'ritual-copy');
      copy.append(el('span','FORTUNE NO. 001—012','match-eyebrow'),el('h3','心定片刻，\n求一支签。'),el('p','想一件此刻在意的事，\n然后，把它交给这一签。','ritual-intro'));
      const note=el('div',undefined,'ritual-instruction');note.append(el('i','一'),el('span','按住轻摇，松手出签。'));copy.append(note,el('span','轻点或按 Enter，同样可以求签。','ritual-accessible'));const steps=el('ol',undefined,'ritual-steps');for(const [n,t]of [['01','心中留一念'],['02','轻摇，等一签'],['03','展开此刻的回信']]){const li=el('li');li.append(el('span',n),el('span',t));steps.append(li);}copy.append(steps);box.append(copy);
      const figure=el('div',undefined,'ritual-figure'),actor=button('', 'lot-actor',e=>{if(e.detail===0)this.drawFortune();});actor.setAttribute('aria-label','求一支签。按住轻摇、松手出签，或按 Enter。');
      this.ritualCanvas??=el('canvas',undefined,'lot-canvas');this.ritualCanvas.setAttribute('aria-hidden','true');actor.append(this.ritualCanvas);const setting=el('div',undefined,'ritual-setting');setting.setAttribute('aria-hidden','true');setting.append(el('i'),el('i'),el('span','一 念 · 一 签'));figure.append(setting,actor);
      const caption=el('div',undefined,'lot-action-caption');caption.append(el('span','按住轻摇 · 松手出签'),el('i',undefined,'lot-charge'));figure.append(caption,el('span','十二支签 / 一念之间','lot-edition'));box.append(figure);this.panel.append(box);
      this.ritual??=new FortuneRitual(this.ritualCanvas,this.isReduced);this.ritual.reset();this.ritual.setActive(this.active);this.art.set('fortune');
      actor.addEventListener('pointerdown',e=>{if(e.button!==0||this.fortunePhase!=='idle')return;e.preventDefault();actor.setPointerCapture(e.pointerId);this.holding=true;this.holdStart=performance.now();this.ritual.hold(true);actor.classList.add('is-holding');const tick=now=>{if(!this.holding)return;figure.style.setProperty('--charge',String(Math.min(1,(now-this.holdStart)/1100)));this.holdFrame=requestAnimationFrame(tick);};this.holdFrame=requestAnimationFrame(tick);});
      actor.addEventListener('pointermove',e=>{const r=actor.getBoundingClientRect();this.ritual.pointer((e.clientX-r.left-r.width/2)/(r.width/2));});actor.addEventListener('pointerleave',()=>this.ritual.pointer(0));
      actor.addEventListener('pointerup',()=>{if(this.holding){this.cancelHold();this.drawFortune();}});actor.addEventListener('pointercancel',()=>this.cancelHold());actor.addEventListener('lostpointercapture',()=>this.cancelHold());
    }
    cancelHold(){this.holding=false;this.ritual?.hold(false);cancelAnimationFrame(this.holdFrame);this.holdFrame=0;const actor=this.panel?.querySelector('.lot-actor');actor?.classList.remove('is-holding');}
    drawFortune(){
      if(this.mode!=='fortune'||this.fortunePhase!=='idle')return;this.cancelHold();this.fortunePhase='drawing';this.stage.dataset.phase='drawing';const actor=this.panel.querySelector('.lot-actor');actor?.classList.add('is-drawing');if(actor){actor.disabled=true;actor.setAttribute('aria-label','正在出签');}
      this.panel.querySelector('.lot-action-caption span').textContent='静候一签，缓缓揭晓。';const choices=D.fortunes.filter(f=>f.id!==this.fortune?.id);this.fortune=choices[Math.floor(Math.random()*choices.length)];this.ritual?.drawLot(this.fortune.id);
      this.drawTimer=setTimeout(()=>{this.fortunePhase='revealed';this.render(true);},this.isReduced()?0:2300);
    }
    fortuneResult(){
      const f=this.fortune,box=el('div',undefined,'fortune-reveal');
      const heading=el('div',undefined,'fortune-result-heading');heading.append(el('span','A LETTER FOR THIS MOMENT','match-eyebrow'),el('h3','你的一念，有了回信。'));box.append(heading);
      const wrap=el('div',undefined,'ticket-wrap'),paper=el('article',undefined,'lot-ticket');paper.setAttribute('aria-label','第'+f.id+'签，'+f.rank+'，'+f.title);
      const left=el('section',undefined,'ticket-leaf ticket-leaf-left');left.append(el('span','苏的鱼干 · 随心一签','ticket-edition'),column('span',f.rank,'ticket-rank'),column('h4',f.title,'ticket-title'),el('span','第 '+f.id+' 签 / 十二签','ticket-number'));
      const center=el('section',undefined,'ticket-leaf ticket-leaf-center'),poem=el('div',undefined,'ticket-poem');f.verse.forEach(line=>poem.append(column('p',line)));center.append(el('span','签 诗','ticket-section-label'),poem,el('span',f.mark,'ticket-mark'));
      const right=el('section',undefined,'ticket-leaf ticket-leaf-right');right.append(el('span','解 · 此刻','ticket-section-label'),el('p',f.meaning,'ticket-meaning'));for(const [name,text]of [['宜',f.good],['缓',f.slow]]){const row=el('div',undefined,'ticket-advice');row.append(el('b',name),el('span',text));right.append(row);}right.append(el('footer','愿你今日，自有好光景。'));
      paper.append(left,center,right);wrap.append(paper);box.append(wrap);
      const bottom=el('div',undefined,'fortune-result-bottom'),actions=el('div',undefined,'fortune-actions');actions.append(button('收好，再求一签 ↻','lot-reset',()=>{this.fortunePhase='idle';this.render();}),button('看看我们合不合拍 ↗','lot-to-match',()=>this.switchMode('match')));bottom.append(actions,el('small','随心一签，仅作趣味。','fortune-disclaimer'));box.append(bottom);this.panel.append(box);this.art.set('fortune');
    }
    welcome(){
      const demo=D.questions.some(q=>!q.requiresOwnerAnswer&&!Object.hasOwn(D.ownerAnswers,q.id)),pending=D.questions.some(T.pendingOwner),box=el('div',undefined,'frequency-intro');
      const heading=el('div',undefined,'frequency-intro-heading');heading.append(el('span','TWO PEOPLE. TWO RHYTHMS.','match-eyebrow'),el('h3','来，调个频。'),el('p','从一些喜欢，聊到怎么相处。','frequency-intro-copy'));box.append(heading);
      const view=el('div',undefined,'resonance-viewport intro-resonance');view.setAttribute('aria-hidden','true');box.append(view);
      const bottom=el('div',undefined,'frequency-intro-bottom');bottom.append(button('开始聊聊 ↗','match-start',()=>this.begin()),el('span','十五个问题 · 随时可以跳过','frequency-duration'));if(demo)bottom.append(el('small','目前使用预览偏好，待本人填写后用于真实匹配。','match-demo-note'));else if(pending)bottom.append(el('small','新增问题尚在补答，未填写的部分暂不计分。','match-demo-note'));box.append(bottom);this.panel.append(box);this.art.set('welcome');this.animateMatch(box);
    }
    animateMatch(box){
      if(this.isReduced())return;
      const title=box.querySelector('h3');if(title)title.animate([{opacity:0,filter:'blur(5px)',transform:'translateY(22px)'},{opacity:1,filter:'blur(0)',transform:'translateY(0)'}],{duration:720,easing:'cubic-bezier(.16,1,.3,1)'});
      box.querySelectorAll('.match-option').forEach((option,i)=>option.animate([{opacity:0,transform:'translateY(20px)'},{opacity:1,transform:'translateY(0)'}],{duration:600,delay:70+i*45,fill:'backwards',easing:'cubic-bezier(.16,1,.3,1)'}));
    }
    begin(){this.limit=T.settings.initial;this.history=[];this.answers={};this.cursor=0;this.history.push(T.next(this.history,this.answers,this.limit));this.phase='question';this.render(true);}
    cancelAdvance(){clearTimeout(this.advanceTimer);this.advanceTimer=0;this.answerPending=false;this.stage?.classList.remove('is-answering');const next=this.panel?.querySelector('.match-next');if(next&&Object.hasOwn(this.answers,this.history[this.cursor]?.id))next.hidden=false;}
    choose(id){
      if(this.answerPending)return;
      const q=this.history[this.cursor];if(id!==null&&!q.options.some(o=>o.id===id))return;
      if(this.answers[q.id]!==id){for(const old of this.history.slice(this.cursor+1))delete this.answers[old.id];this.history.length=this.cursor+1;}
      this.answers[q.id]=id;this.panel.querySelectorAll('.match-option').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.option===id)));const next=this.panel.querySelector('.match-next');if(next)next.disabled=false;
      if(id!==null&&this.active){this.answerPending=true;this.stage.classList.add('is-answering');const selected=this.panel.querySelector(`[data-option="${id}"]`);if(selected)this.art.select(selected.getBoundingClientRect());const cursor=this.cursor;this.advanceTimer=setTimeout(()=>{this.advanceTimer=0;this.answerPending=false;if(this.active&&this.mode==='match'&&this.phase==='question'&&this.cursor===cursor&&this.history[cursor]?.id===q.id)this.next();},this.isReduced()?90:560);}
    }
    next(skip=false){
      this.cancelAdvance();const q=this.history[this.cursor];if(skip)this.choose(null);if(!Object.hasOwn(this.answers,q.id))return;
      if(this.cursor<this.history.length-1){this.cursor++;this.render(true);return;}
      const next=T.next(this.history,this.answers,this.limit);if(next){this.history.push(next);this.cursor++;this.render(true);}else{this.result=T.result(this.history,this.answers);this.phase='result';this.render(true);}
    }
    extend(){this.limit=Math.min(this.limit+T.settings.extra,T.settings.max);const next=T.next(this.history,this.answers,this.limit);if(next){this.cursor=this.history.length;this.history.push(next);this.phase='question';this.render(true);}}
    question(){
      const q=this.history[this.cursor],box=el('form',undefined,'match-question frequency-question');box.addEventListener('submit',e=>{e.preventDefault();this.next();});
      const groups={reading:'阅读',games:'游戏',anime:'动漫',stories:'故事',music:'音乐',self:'自己',social:'相处',values:'观念'},meta=el('div',undefined,'frequency-question-top');meta.append(el('span',groups[q.group]||'聊聊','frequency-topic'));
      const progress=el('nav',undefined,'frequency-progress');progress.setAttribute('aria-label','答题进度，已回答的题目可返回');for(let i=0;i<this.limit;i++){const dot=button('', 'frequency-step',()=>{if(i<this.history.length){this.cursor=i;this.render(true);}});dot.disabled=i>=this.history.length;dot.setAttribute('aria-label','第 '+(i+1)+' 题'+(i<this.cursor?'，已回答':''));if(i===this.cursor)dot.setAttribute('aria-current','step');if(i<this.cursor)dot.classList.add('is-complete');progress.append(dot);}meta.append(progress,el('span',String(this.cursor+1).padStart(2,'0')+' / '+String(this.limit).padStart(2,'0'),'frequency-counter'));box.append(meta);
      const body=el('div',undefined,'frequency-question-body'),heading=el('div',undefined,'match-question-title');heading.append(el('span',q.parent?'沿着这个喜欢，再聊一点。':'先听听你的想法。','frequency-question-lead'),el('h3',q.prompt));body.append(heading);
      const options=el('div',undefined,'match-options frequency-options');options.dataset.count=q.options.length;options.dataset.long=String(q.options.some(o=>o.label.length>10));q.options.forEach((o,i)=>{const b=button('', 'match-option',()=>{if(this.phase==='question'&&this.history[this.cursor]?.id===q.id)this.choose(o.id);});b.dataset.option=o.id;b.setAttribute('aria-pressed',String(this.answers[q.id]===o.id));b.append(el('span',String.fromCharCode(65+i),'match-option-letter'),el('span',o.label,'frequency-option-label'),el('i',o.skip?'—':'↗'));options.append(b);});body.append(options);box.append(body);
      const footer=el('div',undefined,'match-question-footer'),back=button('← 上一题','match-back',()=>{this.cursor--;this.render(true);});back.disabled=this.cursor===0;const skip=button('跳过这题 ↗','match-skip',()=>this.next(true)),next=el('button',this.cursor===this.limit-1?'看看同频率 ↗':'继续 →','match-next');next.type='submit';next.disabled=!Object.hasOwn(this.answers,q.id);next.hidden=next.disabled;footer.append(back,el('span','选中自动继续 · 1—4 也可以','match-keyboard-note'),skip,next);box.append(footer);this.panel.append(box);this.art.set('question',{answered:this.cursor,total:this.limit});this.animateMatch(box);
    }
    updateMotionControls(){
      const note=this.panel.querySelector('.resonance-instruction');if(note)note.textContent=this.isReduced()?'静态呈现':this.result?.score===null?'可以重新开始，留下几个回答。':'轻拨光点，看节奏如何变化。';
    }
    showResult(){
      const r=this.result,box=el('div',undefined,'frequency-result');
      const top=el('div',undefined,'frequency-result-top');top.append(el('span','A LITTLE RESONANCE','match-eyebrow'),el('h3','这一轮，我们的同频率。'));box.append(top);
      const view=el('div',undefined,'resonance-viewport result-resonance');const touch=button('', 'resonance-touch',()=>this.art.nudge());touch.setAttribute('aria-label','轻拨两束光，观察它们重新找到节奏');touch.disabled=r.score===null;view.append(touch);
      const center=el('div',undefined,'frequency-result-center'),score=el('div',undefined,'match-score');score.setAttribute('role','img');score.setAttribute('aria-label',r.score===null?'本轮没有可比较的答案':'本轮合拍度 '+Math.round(r.score*100)+'%');score.append(el('span',r.score===null?'—':this.isReduced()?String(Math.round(r.score*100)):'0','match-score-number'));if(r.score!==null)score.append(el('span','%','match-score-unit'));center.append(score,el('span',`本轮 ${r.total} 题 · 有效 ${r.compared} 题`,'match-result-count'));if(r.demo)center.append(el('small','预览分值 · 尚未完整录入本人偏好','match-demo-note'));else if(r.pendingOwner)center.append(el('small',`${r.pendingOwner} 题待本人补答，暂未计分`,'match-demo-note'));view.append(center);box.append(view);
      const lower=el('div',undefined,'frequency-result-bottom'),caption=el('div',undefined,'resonance-caption');caption.append(el('span','● 你','resonance-you'),el('span',r.score===null?'暂时没有足够的回答':'节奏越接近，越合拍','resonance-caption-copy'),el('span','● 苏的鱼干','resonance-owner'));lower.append(caption);
      const actions=el('div',undefined,'match-result-actions');if(this.limit<T.settings.max)actions.append(button('再聊十题 →','match-more',()=>this.extend()));actions.append(button('重新开始 ↻','match-again',()=>this.begin()),button('保存这次相遇 ↓','match-save',()=>this.art.save(r.score===null?'—':Math.round(r.score*100)+'%')));lower.append(actions);const controls=el('div',undefined,'resonance-controls');if(r.score!==null){const pause=button('暂停流动 Ⅱ','resonance-pause',()=>{const paused=this.art.togglePause();pause.setAttribute('aria-pressed',String(paused));pause.textContent=paused?'继续流动 ▷':'暂停流动 Ⅱ';});pause.setAttribute('aria-pressed','false');controls.append(pause);}controls.append(el('span',this.isReduced()?'静态呈现':r.score===null?'可以重新开始，留下几个回答。':'轻拨光点，看节奏如何变化。','resonance-instruction'));lower.append(controls);box.append(lower);this.panel.append(box);
      // The artwork receives only the aggregate: no question IDs, comparisons, or owner choices.
      this.art.set('result',{score:r.score,total:r.total,compared:r.compared,demo:r.demo,pendingOwner:r.pendingOwner});this.animateMatch(box);
    }
  };
})();
