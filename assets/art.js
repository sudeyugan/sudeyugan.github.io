/* Small, tactile art gestures that remain tied to the visitor's actions. */
(() => {
  'use strict';
  window.HomeArt=class{
    constructor(isReduced,motion){
      this.isReduced=isReduced;this.motion=motion;this.lastScene=null;this.stamps=0;this.color=0;
      this.layer=document.querySelector('.art-bursts');
      document.querySelectorAll('.portal,.hello-postcard,.capability-panel').forEach(element=>{
        element.addEventListener('pointermove',event=>{
          if(this.isReduced()||event.pointerType==='touch')return;
          const r=element.getBoundingClientRect();element.style.setProperty('--hover-x',Math.max(-.5,Math.min(.5,(event.clientX-r.left)/r.width-.5)));element.style.setProperty('--hover-y',Math.max(-.5,Math.min(.5,(event.clientY-r.top)/r.height-.5)));
        });
        element.addEventListener('pointerleave',()=>{element.style.setProperty('--hover-x',0);element.style.setProperty('--hover-y',0);});
      });
      const old=document.querySelector('.name-spark'),spark=document.createElement('button');spark.type='button';spark.className=old.className;spark.textContent=old.textContent;spark.setAttribute('aria-label','换一束灵感');spark.dataset.cursor='一点灵感';old.replaceWith(spark);
      spark.addEventListener('click',()=>{
        const colors=['#3451ce','#567a4b','#b86147'];this.color=(this.color+1)%colors.length;
        document.querySelector('.kinetic-name').style.setProperty('--name-accent',colors[this.color]);document.querySelector('.name-annotation').style.color=colors[this.color];
        if(!this.isReduced())this.motion.glyphs.forEach((g,i)=>{g.y-=22+i*5;g.vy=-4;g.r=(i-1.5)*4;});
        this.burst(spark,['✳','·','⌁']);
      });
      const stamp=document.querySelector('.postcard-stamp');
      stamp.addEventListener('click',()=>{
        this.stamps++;const mark=document.querySelector('.postcard-postmark');mark.classList.add('is-stamped');
        if(!this.isReduced()){
          stamp.animate([{transform:'rotate(9deg) scale(1)'},{transform:'rotate(3deg) scale(.85)',offset:.35},{transform:'rotate(9deg) scale(1)'}],{duration:500,easing:'cubic-bezier(.2,.8,.2,1)'});
          mark.animate([{opacity:0,transform:'rotate(-18deg) scale(1.6)'},{opacity:.85,transform:'rotate(-9deg) scale(.96)',offset:.65},{opacity:.75,transform:'rotate(-10deg) scale(1)'}],{duration:600,easing:'cubic-bezier(.16,1,.3,1)'});
        }
        this.burst(stamp,['·','⌁','✳']);
      });
      document.querySelectorAll('.about-word').forEach(button=>button.addEventListener('click',()=>{
        if(this.isReduced())return;
        button.querySelector('.word-letters').animate([{scale:'1 1'},{scale:'1.04 .94',offset:.35},{scale:'1 1'}],{duration:650,easing:'cubic-bezier(.16,1,.3,1)'});
      }));
      this.bindFragments();this.bindPostcard();
    }
    bindFragments(){
      document.querySelectorAll('.fragment-card').forEach(card=>{
        card.addEventListener('click',()=>{
          const open=card.getAttribute('aria-expanded')!=='true';card.setAttribute('aria-expanded',String(open));
          card.querySelector('.fragment-front').hidden=open;card.querySelector('.fragment-back').hidden=!open;

          if(!this.isReduced()){
            card.getAnimations().forEach(a=>a.cancel());
            card.animate([{transform:'perspective(700px) rotateX(-14deg) translateY(-8px)'},{transform:'perspective(700px) rotateX(4deg) translateY(2px)',offset:.65},{transform:'perspective(700px) rotateX(0) translateY(0)'}],{duration:750,easing:'cubic-bezier(.16,1,.3,1)'});
            const text=card.querySelector(open?'.fragment-back':'.fragment-front');text.animate([{opacity:0,translate:'0 7px'},{opacity:1,translate:'0 0'}],{duration:500,easing:'ease-out'});
          }
        });
      });
    }
    bindPostcard(){
      const card=document.querySelector('.hello-postcard'),flip=card.querySelector('.postcard-flip'),reverse=card.querySelector('.postcard-reverse');
      flip.addEventListener('click',()=>{
        const open=flip.getAttribute('aria-expanded')!=='true';flip.setAttribute('aria-expanded',String(open));card.classList.toggle('is-flipped',open);reverse.hidden=!open;
        flip.textContent=open?'回到正面 ↗':'翻到背面 ↗';
        if(!this.isReduced())card.animate([{rotate:'y -23deg',scale:'.96'},{rotate:'y 5deg',scale:'1.015',offset:.6},{rotate:'y 0deg',scale:'1'}],{duration:800,easing:'cubic-bezier(.16,1,.3,1)'});
      });
      let drag;
      card.addEventListener('pointerdown',e=>{
        if(e.button!==0||e.target.closest('button,a')||this.isReduced())return;
        drag={x:e.clientX,y:e.clientY};card.setPointerCapture(e.pointerId);card.classList.add('is-dragged');
      });
      card.addEventListener('pointermove',e=>{
        if(!drag)return;
        const x=Math.max(-85,Math.min(85,e.clientX-drag.x)),y=Math.max(-55,Math.min(55,e.clientY-drag.y));
        card.style.setProperty('--paper-x',x+'px');card.style.setProperty('--paper-y',y+'px');card.style.setProperty('--paper-turn',x*.09+'deg');
      });
      const release=()=>{if(!drag)return;drag=null;card.classList.remove('is-dragged');card.style.setProperty('--paper-x','0px');card.style.setProperty('--paper-y','0px');card.style.setProperty('--paper-turn','0deg');};
      card.addEventListener('pointerup',release);card.addEventListener('pointercancel',release);card.addEventListener('lostpointercapture',release);
      const boat=document.querySelector('.paper-boat');let boatX=30;
      document.querySelectorAll('.opener-tabs button').forEach((button,index)=>button.addEventListener('click',()=>{
        const end=30+index*160;this.boatAnimation?.cancel();
        boat.style.setProperty('--boat-x',end+'px');
        if(!this.isReduced()){
          this.boatAnimation=boat.animate([{transform:`translate(${boatX}px,62px) rotate(-5deg)`},{transform:`translate(${(boatX+end)/2}px,55px) rotate(7deg)`,offset:.5},{transform:`translate(${end}px,62px) rotate(0)`}],{duration:1700,easing:'cubic-bezier(.3,.6,.2,1)'});
        }
        boatX=end;
      }));
      document.querySelector('.copy-opener').addEventListener('click',()=>{this.burst(boat,['·','⌁','♡']);});
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
      const accents={hello:'.signature-line path',about:'#story-path',xiaoyu:'.pet-floor',contact:'.postcard-stamp'};
      const element=document.querySelector(accents[id]);if(!element)return;
      if(id==='hello'||id==='about')element.animate([{strokeDashoffset:560},{strokeDashoffset:0}],{duration:1300,easing:'cubic-bezier(.16,1,.3,1)'});
      if(id==='xiaoyu')element.animate([{scale:'.86 .86',opacity:.3},{scale:'1 1',opacity:1}],{duration:1100,easing:'cubic-bezier(.16,1,.3,1)'});
      if(id==='contact')element.animate([{transform:'translateY(-14px) rotate(-14deg)'},{transform:'translateY(0) rotate(9deg)'}],{duration:900,easing:'cubic-bezier(.16,1,.3,1)'});
    }
  };
})();
