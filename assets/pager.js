/* Native wheel/touch scroll drives a continuous horizontal composition. */
(() => {
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const palette=[[242,240,233],[234,240,231],[233,237,245],[242,240,219]];
  window.ScrollScenes=class{
    constructor(scenes,isReduced,onChange,onSettle){
      this.entries=Object.entries(scenes);this.isReduced=isReduced;this.onChange=onChange;this.onSettle=onSettle;
      this.bridge=document.querySelector('.transition-art');this.bridgeWord=this.bridge.querySelector('.transition-word');this.position=0;this.target=0;this.active=-1;this.pending=null;this.settled=false;this.blocked=false;
      this.entries.forEach(([,el])=>{el.hidden=false;el.style.visibility='hidden';});
      this.onScroll=()=>{if(!this.blocked){this.target=clamp(scrollY/innerHeight,0,this.entries.length-1);this.settled=false;}};
      addEventListener('scroll',this.onScroll,{passive:true});
      let resizeTimer;addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{const at=Math.max(0,this.active);scrollTo({top:at*innerHeight,behavior:'instant'});this.target=at;},130);});
      this.loop=this.loop.bind(this);requestAnimationFrame(this.loop);
    }
    lock(value){this.blocked=value;document.documentElement.classList.toggle('scroll-locked',value);}
    go(id,instant=false){
      const index=this.entries.findIndex(([name])=>name===id);if(index<0)return Promise.resolve();
      if(this.pending)this.pending.resolve();
      this.target=index;this.settled=false;
      scrollTo({top:index*innerHeight,behavior:this.isReduced()||instant?'instant':'smooth'});
      if(instant){this.position=index;this.render();}
      return new Promise(resolve=>{this.pending={index,resolve};});
    }
    loop(){
      requestAnimationFrame(this.loop);if(document.hidden)return;
      const delta=this.target-this.position;
      if(Math.abs(delta)>.0002){this.position=this.isReduced()?this.target:this.position+delta*.16;this.render();}
      else if(!this.settled){this.position=this.target;this.render();this.settled=true;this.onSettle?.(this.entries[Math.round(this.position)][0]);}
      if(this.pending&&Math.abs(this.position-this.pending.index)<.003&&Math.abs(scrollY/innerHeight-this.pending.index)<.005){const done=this.pending;this.pending=null;done.resolve();}
    }
    render(){
      const p=clamp(this.position,0,3),low=Math.floor(p),fraction=p-low;
      const a=palette[low],b=palette[Math.min(3,low+1)];
      document.documentElement.style.setProperty('--surface',`rgb(${a.map((value,i)=>Math.round(value+(b[i]-value)*fraction)).join(',')})`);
      document.documentElement.style.setProperty('--journey-progress',String(p/3));
      this.entries.forEach(([id,el],i)=>{
        const offset=i-p,visible=Math.abs(offset)<1.18;
        el.style.visibility=visible?'visible':'hidden';
        if(visible){
          el.style.transform=this.isReduced()?`translate3d(${offset*100}%,0,0)`:`translate3d(${offset*104}%,${Math.abs(offset)*27}px,0) rotate(${offset*-1.35}deg) scale(${1-Math.min(1,Math.abs(offset))*.055})`;
          el.style.opacity=String(1-Math.min(1,Math.abs(offset))*.28);el.style.setProperty('--scene-offset',String(offset));el.style.setProperty('--scene-travel',String(Math.min(1,Math.abs(offset))));
        }
        const active=i===Math.round(p);el.inert=!active;el.setAttribute('aria-hidden',String(!active));
      });
      const pulse=Math.sin(Math.PI*fraction),travelling=!this.isReduced()&&pulse>.012;
      this.bridge.style.opacity=travelling?String(pulse*.65):'0';
      if(travelling){
        this.bridge.style.transform=`translate3d(${(1-fraction)*innerWidth-65}px,0,0)`;
        this.bridge.style.setProperty('--bridge-turn',`${-8+fraction*16}deg`);
        this.bridgeWord.textContent=['HELLO','CURIOUS','XIAOYU','SAY HELLO'][Math.min(3,low+1)];
      }
      document.documentElement.classList.toggle('is-travelling',travelling);
      const nearest=Math.round(p);
      if(nearest!==this.active){this.active=nearest;this.onChange(this.entries[nearest][0]);}
      const links=[...document.querySelectorAll('.scene-nav [data-nav]')],from=links[low],to=links[Math.min(3,low+1)];
      if(from&&to){const nav=document.querySelector('.scene-nav'),line=document.querySelector('.nav-active-line'),pad=parseFloat(getComputedStyle(nav).paddingLeft);line.style.transition='none';line.style.width=`${from.offsetWidth+(to.offsetWidth-from.offsetWidth)*fraction}px`;line.style.transform=`translateX(${from.offsetLeft-pad+(to.offsetLeft-from.offsetLeft)*fraction}px)`;}
    }
  };
})();
