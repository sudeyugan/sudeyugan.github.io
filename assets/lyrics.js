/* Audio-clock typography with readable DOM text and a bounded particle field. */
(() => {
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  window.KineticLyrics=class {
    constructor(audio,scene,isReduced){
      this.audio=audio;this.scene=scene;this.isReduced=isReduced;this.stage=scene.querySelector('.lyric-stage');this.canvas=scene.querySelector('.lyric-canvas');this.cues=window.MOVE_MOUNTAINS_LYRICS||[];
      this.index=-2;this.active=false;this.frame=0;this.lastTime=0;this.interactionUntil=0;this.animations=[];this.field=new LyricField(this.stage,audio);this.tick=this.tick.bind(this);this.sync(true);
      audio.addEventListener('timeupdate',()=>this.sync());audio.addEventListener('seeking',()=>this.sync(true));
      audio.addEventListener('play',()=>{this.sync();this.wake();});audio.addEventListener('pause',()=>{this.sync();this.stop();});audio.addEventListener('ended',()=>this.stop());
      audio.addEventListener('volumechange',()=>{if(this.active){this.field.draw(performance.now(),true);this.wake();}});
      this.resizeObserver=new ResizeObserver(()=>this.fit());this.resizeObserver.observe(this.stage);
      addEventListener('site:motion',()=>{this.stop();this.fit();this.wake();});document.addEventListener('visibilitychange',()=>{if(document.hidden)this.stop();});
      this.stage.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||this.isReduced())return;this.field.point(e);this.interact();},{passive:true});
      this.stage.addEventListener('pointerleave',()=>{this.field.release();this.interact();});
      this.stage.addEventListener('click',e=>{if(this.isReduced())return;this.field.tap(e);this.interact(1100);});
    }
    setActive(active){this.active=active;if(!active){this.stop();this.field.release();this.interactionUntil=0;}else{this.sync(true);this.fit();this.wake();}}
    find(t){let index=-1;for(let i=0;i<this.cues.length;i++){if(t+.001>=this.cues[i].start)index=i;else break;}return index;}
    sync(skip=false){
      if(!this.active&&this.index!==-2&&!skip)return;
      const t=this.audio.currentTime||0,index=this.find(t),jump=Math.abs(t-this.lastTime)>.65;this.lastTime=t;
      if(index!==this.index)this.render(index,skip||jump||this.audio.paused);else if(skip&&this.active&&!this.isReduced()){this.field.snap=true;this.field.draw(performance.now(),true);}
      if(index>=0){const cue=this.cues[index],progress=clamp((t-cue.start)/(cue.end-cue.start),0,1);this.stage.style.setProperty('--cue-progress',progress);}
    }
    interact(duration=850){if(!this.active||this.isReduced())return;this.interactionUntil=performance.now()+duration;this.wake();}
    wake(){if(!this.frame&&this.active&&!this.isReduced()&&!document.hidden&&(!this.audio.paused||performance.now()<this.interactionUntil))this.frame=requestAnimationFrame(this.tick);}
    tick(now){this.frame=0;this.sync();this.field.draw(now);this.wake();}
    stop(){cancelAnimationFrame(this.frame);this.frame=0;}
    render(index,snap){
      this.index=index;const cue=this.cues[index],text=cue?.text||'Move mountains.',focus=cue?.focus||cue?.parts.find(part=>part.role==='hero')?.text||'mountains',at=text.toLowerCase().indexOf(focus.toLowerCase());
      this.visual?.remove();this.visual=document.createElement('div');this.visual.className='lyric-visual lyric-performance';this.visual.dataset.form=cue?.layout||'poster';this.visual.dataset.variation=String(this.cues.slice(0,index).filter(c=>c.layout==='mountains').length%3);
      const lead=document.createElement('div');lead.className='lyric-prelude';lead.textContent=at>=0?text.slice(0,at).trim():'';
      const wrap=document.createElement('div');wrap.className='lyric-focus-wrap';this.focus=document.createElement('span');this.focus.className='lyric-focus';this.focus.textContent=at>=0?text.slice(at,at+focus.length):focus;if(cue?.layout==='mountains')this.focus.textContent=this.focus.textContent.toUpperCase();wrap.append(this.focus);
      const tail=document.createElement('div');tail.className='lyric-coda';tail.textContent=at>=0?text.slice(at+focus.length).trim():text;
      this.visual.append(lead,wrap,tail);this.canvas.append(this.visual);this.stage.dataset.layout=cue?.layout||'poster';this.stage.dataset.cue=String(index);
      this.stage.querySelector('.lyric-cue-count').textContent=`${String(index+1).padStart(2,'0')} / ${this.cues.length}`;
      this.stage.querySelector('.lyric-readable').textContent=cue?.text||'Move Mountains — 点击声音形体播放。';this.stage.querySelector('.lyric-stage-note').textContent='字也可以碰一碰';
      this.fit(snap);this.interactionUntil=0;
    }
    fit(snap=true){
      if(!this.focus)return;const width=this.canvas.clientWidth,height=this.canvas.clientHeight;if(width<10||height<10)return;
      this.stage.classList.toggle('is-static-type',this.isReduced());this.stage.classList.remove('has-particle-type');
      const max=Math.min(width*.25,height*.49,210);this.focus.style.fontSize=max+'px';
      const measured=this.focus.getBoundingClientRect().width;if(measured>width*.92)this.focus.style.fontSize=max*width*.92/measured+'px';
      for(const part of this.visual.querySelectorAll('.lyric-prelude,.lyric-coda')){part.style.fontSize='';const desired=parseFloat(getComputedStyle(part).fontSize);if(part.scrollWidth>width*.95)part.style.fontSize=desired*width*.95/part.scrollWidth+'px';}
      if(!this.isReduced())this.field.rebuild(this.focus,this.cues[this.index]?.layout||'poster',snap);else this.field.ctx?.clearRect(0,0,this.field.width||0,this.field.height||0);
    }
    step(direction){const next=clamp(this.find(this.audio.currentTime)+direction,0,this.cues.length-1);this.audio.currentTime=this.cues[next].start;this.sync(true);}
  };
})();
