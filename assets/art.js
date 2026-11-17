/* Small, tactile art gestures that remain tied to the visitor's actions. */
(() => {
  'use strict';
  window.HomeArt=class{
    constructor(isReduced,motion){
      this.isReduced=isReduced;this.motion=motion;this.lastScene=null;this.color=0;
      this.layer=document.querySelector('.art-bursts');
      document.querySelectorAll('.portal,.capability-panel').forEach(element=>{
        element.addEventListener('pointermove',event=>{
          if(this.isReduced()||event.pointerType==='touch')return;
          const r=element.getBoundingClientRect();element.style.setProperty('--hover-x',Math.max(-.5,Math.min(.5,(event.clientX-r.left)/r.width-.5)));element.style.setProperty('--hover-y',Math.max(-.5,Math.min(.5,(event.clientY-r.top)/r.height-.5)));
        });
        element.addEventListener('pointerleave',()=>{element.style.setProperty('--hover-x',0);element.style.setProperty('--hover-y',0);});
      });
      const old=document.querySelector('.name-spark'),spark=document.createElement('button');spark.type='button';spark.className=old.className;spark.textContent=old.textContent;spark.setAttribute('aria-label','换一束灵感');old.replaceWith(spark);
      spark.addEventListener('click',()=>{
        const colors=['#3451ce','#567a4b','#b86147'];this.color=(this.color+1)%colors.length;
        document.querySelector('.kinetic-name').style.setProperty('--name-accent',colors[this.color]);document.querySelector('.name-annotation').style.color=colors[this.color];
        if(!this.isReduced())this.motion.glyphs.forEach((g,i)=>{g.y-=22+i*5;g.vy=-4;g.r=(i-1.5)*4;});
        this.burst(spark,['✳','·','⌁']);
      });
    }
    burst(element,symbols){
      if(this.isReduced())return;
      const r=element.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
      for(let i=0;i<7;i++){
        const item=document.createElement('span');item.textContent=symbols[i%symbols.length];item.style.left=x+'px';item.style.top=y+'px';item.style.fontSize=(i%3===0?20:13)+'px';this.layer.append(item);
        const angle=i/7*Math.PI*2,distance=35+(i%3)*15;
        item.animate([{opacity:0,transform:'translate(-50%,-50%) scale(.3)'},{opacity:.8,offset:.15},{opacity:0,transform:`translate(calc(-50% + ${Math.cos(angle)*distance}px),calc(-50% + ${Math.sin(angle)*distance}px)) rotate(${i*25}deg) scale(.9)`}],{duration:800+i*35,easing:'cubic-bezier(.15,.5,.3,1)'}).finished.then(()=>item.remove());
      }
    }
    settle(id){
      if(this.lastScene===id)return;this.lastScene=id;if(this.isReduced())return;
      const accents={hello:'.signature-line path',about:'.favorites-asterisk',xiaoyu:'.pet-floor',contact:'.match-welcome h3'};
      const element=document.querySelector(accents[id]);if(!element)return;
      if(id==='hello')element.animate([{strokeDashoffset:560},{strokeDashoffset:0}],{duration:1300,easing:'cubic-bezier(.16,1,.3,1)'});
      if(id==='xiaoyu')element.animate([{scale:'.86 .86',opacity:.3},{scale:'1 1',opacity:1}],{duration:1100,easing:'cubic-bezier(.16,1,.3,1)'});
      if(id==='contact')element.animate([{opacity:.4,translate:'0 12px'},{opacity:1,translate:'0 0'}],{duration:850,easing:'cubic-bezier(.16,1,.3,1)'});
    }
  };
})();
