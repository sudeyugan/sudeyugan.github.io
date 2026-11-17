/* The poster's gestures stay inside the first scene. No remote services. */
(() => {
  'use strict';
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  window.HomePoster=class {
    constructor(isReduced,motion){
      this.isReduced=isReduced;this.motion=motion;this.scene=document.querySelector('#scene-hello');
      this.letterAnimations=new Map();this.entryAnimations=new Map();this.greeting=0;
      this.splitLetters();this.bindLetters();this.bindEntries();this.bindLine();this.bindGreeting();
      this.scene.querySelector('.name-reset').addEventListener('click',()=>motion.resetName());
      const spark=this.scene.querySelector('.name-spark');
      spark.setAttribute('aria-label','换个颜色和星星形状');
      const star=document.createElementNS('http://www.w3.org/2000/svg','svg'),starShape=document.createElementNS('http://www.w3.org/2000/svg','path');
      star.setAttribute('viewBox','0 0 100 100');star.setAttribute('aria-hidden','true');star.append(starShape);spark.replaceChildren(star);
      const drawStar=index=>{
        const [points,inner]=[[8,20],[4,10],[6,26]][index];let path='';
        for(let i=0;i<points*2;i++){const angle=-Math.PI/2+i*Math.PI/points,radius=i%2?inner:46;path+=(i?'L':'M')+(50+Math.cos(angle)*radius).toFixed(2)+' '+(50+Math.sin(angle)*radius).toFixed(2);}
        starShape.setAttribute('d',path+'Z');
      };
      drawStar(0);
      let style=0;
      spark.addEventListener('click',()=>{
        style=(style+1)%3;drawStar(style);
        const color=this.scene.querySelector('.kinetic-name').style.getPropertyValue('--name-accent');
        this.scene.style.setProperty('--poster-accent',color);
        this.scene.style.setProperty('--poster-tint',['#e1e6f5','#e0e7d8','#edddd3'][style]);
        if(!this.isReduced()){
          this.sparkAnimation?.cancel();this.sparkAnimation=star.animate([{transform:'rotate(-35deg) scale(.6)'},{transform:'rotate(8deg) scale(1.08)',offset:.65},{transform:'rotate(0) scale(1)'}],{duration:650,easing:'cubic-bezier(.2,.7,.3,1)'});
        }
      });
      addEventListener('site:content',()=>this.splitLetters());
      addEventListener('site:motion',()=>{if(this.isReduced())this.clear();});
      addEventListener('blur',()=>this.releaseLine());
      document.addEventListener('visibilitychange',()=>{if(document.hidden)this.clear();});
      addEventListener('scroll',()=>{if(document.documentElement.dataset.view!=='hello')this.releaseLine();},{passive:true});
    }
    splitLetters(){
      this.scene.querySelectorAll('[data-home-letters]').forEach(element=>{
        if(element.querySelector('.home-letter'))return;
        const copy=element.textContent,accessible=document.createElement('span'),run=document.createElement('span');
        accessible.className='home-sr-only';accessible.textContent=copy;
        run.className='home-letter-run';run.setAttribute('aria-hidden','true');
        for(const letter of copy){const span=document.createElement('span');span.className='home-letter';span.textContent=letter;run.append(span);}
        element.replaceChildren(accessible,run);
      });
    }
    animateLetter(element,weight=1,delay=0){
      if(this.isReduced()||!element||!element.textContent.trim())return;
      this.letterAnimations.get(element)?.cancel();
      const animation=element.animate([
        {transform:'translateY(0) rotate(0) scale(1)'},
        {transform:`translateY(${-5*weight}px) rotate(${4*weight}deg) scale(1.04,.94)`,offset:.24},
        {transform:`translateY(${1.5*weight}px) rotate(${-2*weight}deg) scale(.99,1.02)`,offset:.57},
        {transform:'translateY(0) rotate(0) scale(1)'}
      ],{duration:570,delay,easing:'cubic-bezier(.2,.65,.3,1)'});
      this.letterAnimations.set(element,animation);
      animation.finished.then(()=>{if(this.letterAnimations.get(element)===animation)this.letterAnimations.delete(element);},()=>{});
    }
    bindLetters(){
      let last=null,lastTime=0;
      this.scene.addEventListener('pointermove',event=>{
        if(event.pointerType==='touch'||this.isReduced())return;
        const letter=event.target.closest('.home-letter');if(!letter)return;
        const now=performance.now();if(letter===last&&now-lastTime<250)return;
        last=letter;lastTime=now;
        this.animateLetter(letter);this.animateLetter(letter.previousElementSibling,.45,35);this.animateLetter(letter.nextElementSibling,.45,35);
      },{passive:true});
      this.scene.addEventListener('pointerdown',event=>{if(event.pointerType==='touch')this.animateLetter(event.target.closest('.home-letter'));},{passive:true});
      this.scene.addEventListener('focusin',event=>{
        if(this.isReduced())return;
        event.target.querySelectorAll('[data-home-letters] .home-letter').forEach((letter,i)=>this.animateLetter(letter,.6,i*35));
      });
    }
    bindEntries(){
      this.scene.querySelectorAll('.home-entry').forEach(entry=>{
        entry.addEventListener('pointermove',event=>{
          if(this.isReduced()||event.pointerType==='touch')return;
          const r=entry.getBoundingClientRect();
          entry.style.setProperty('--entry-x',clamp((event.clientX-r.left)/r.width-.5,-.5,.5)*7+'px');
          entry.style.setProperty('--entry-y',clamp((event.clientY-r.top)/r.height-.5,-.5,.5)*5+'px');
        },{passive:true});
        entry.addEventListener('pointerleave',()=>{entry.style.removeProperty('--entry-x');entry.style.removeProperty('--entry-y');});
        const greet=()=>{
          if(this.isReduced())return;
          this.entryAnimations.get(entry)?.cancel();
          entry.querySelectorAll('.entry-title .home-letter').forEach((letter,i)=>this.animateLetter(letter,.9,i*45));
          const art=entry.querySelector('.entry-art');
          const animation=art.animate([{transform:'rotate(0)'},{transform:'rotate(-12deg)',offset:.25},{transform:'rotate(5deg)',offset:.6},{transform:'rotate(0)'}],{duration:800,easing:'cubic-bezier(.2,.7,.3,1)'});
          this.entryAnimations.set(entry,animation);
          animation.finished.then(()=>{if(this.entryAnimations.get(entry)===animation)this.entryAnimations.delete(entry);},()=>{});
          const eye=entry.querySelector('.portrait-eye');
          if(eye){
            this.entryAnimations.get(eye)?.cancel();
            const blink=eye.animate([{scale:'1 1'},{scale:'1 .12',offset:.38},{scale:'1 1',offset:.7},{scale:'1 1'}],{duration:450,delay:180,easing:'ease-in-out'});
            this.entryAnimations.set(eye,blink);
            blink.finished.then(()=>{if(this.entryAnimations.get(eye)===blink)this.entryAnimations.delete(eye);},()=>{});
          }
        };
        entry.addEventListener('pointerenter',greet);entry.addEventListener('focus',greet);
      });
    }
    bindLine(){
      this.lineButton=this.scene.querySelector('.signature-handle');this.linePath=this.lineButton.querySelector('path');
      this.line={x:0,y:0,vx:0,vy:0,tx:0,ty:0,drag:false,frame:0,last:0};
      this.lineButton.addEventListener('pointerdown',event=>{
        if(event.button!==0||this.isReduced())return;
        event.preventDefault();this.line.drag=true;this.lineButton.setPointerCapture(event.pointerId);this.moveLine(event);this.wakeLine();
      });
      this.lineButton.addEventListener('pointermove',event=>{if(this.line.drag){this.moveLine(event);this.wakeLine();}});
      ['pointerup','pointercancel','lostpointercapture'].forEach(type=>this.lineButton.addEventListener(type,()=>this.releaseLine()));
      this.lineButton.addEventListener('click',event=>{if(event.detail===0&&!this.isReduced()){this.line.vy=14;this.wakeLine();}});
      this.drawLine=this.drawLine.bind(this);
    }
    moveLine(event){
      const r=this.lineButton.getBoundingClientRect();
      this.line.tx=clamp(((event.clientX-r.left)/r.width-.5)*150,-75,75);
      this.line.ty=clamp((event.clientY-r.top-r.height/2)*1.8,-48,48);
    }
    releaseLine(){if(!this.line)return;this.line.drag=false;this.line.tx=this.line.ty=0;if(!this.isReduced())this.wakeLine();}
    wakeLine(){if(!this.line.frame&&!this.isReduced()&&!document.hidden)this.line.frame=requestAnimationFrame(this.drawLine);}
    drawLine(now){
      const line=this.line;line.frame=0;
      if(this.isReduced()||document.hidden||document.documentElement.dataset.view!=='hello'){this.resetLine();return;}
      const dt=clamp((now-(line.last||now-16.67))/16.67,.4,2);line.last=now;
      const stiffness=line.drag?.18:.08,damping=line.drag?.65:.83;
      line.vx=(line.vx+(line.tx-line.x)*stiffness*dt)*Math.pow(damping,dt);
      line.vy=(line.vy+(line.ty-line.y)*stiffness*dt)*Math.pow(damping,dt);
      line.x+=line.vx*dt;line.y+=line.vy*dt;
      this.linePath.setAttribute('d',`M5 35Q${225+line.x} ${5+line.y} 445 28`);
      if(line.drag||Math.abs(line.x)+Math.abs(line.y)+Math.abs(line.vx)+Math.abs(line.vy)>.08)this.wakeLine();else this.resetLine();
    }
    resetLine(){cancelAnimationFrame(this.line.frame);Object.assign(this.line,{x:0,y:0,vx:0,vy:0,tx:0,ty:0,drag:false,frame:0,last:0});this.linePath.setAttribute('d','M5 35Q225 5 445 28');}
    bindGreeting(){
      const button=this.scene.querySelector('.hello-salute'),text=button.querySelector('.salute-text');
      button.addEventListener('click',()=>{
        this.greeting++;const greeting=this.greeting%4;text.textContent=['嗨！','你好呀','HELLO!','又见面啦'][greeting];
        text.style.setProperty('--greeting-scale',[1,.78,.7,.65][greeting]);
        if(this.isReduced())return;
        this.saluteAnimation?.cancel();this.saluteAnimation=button.animate([
          {transform:'rotate(0) scale(1)'},{transform:'rotate(-10deg) scale(.9,1.08)',offset:.2},
          {transform:'rotate(7deg) scale(1.06,.96)',offset:.52},{transform:'rotate(0) scale(1)'}
        ],{duration:750,easing:'cubic-bezier(.2,.65,.3,1)'});
        this.motion.glyphs.forEach((g,i)=>{g.vy-=6+i*1.7;g.vr+=(i%2?1:-1)*3;});
      });
    }
    clear(){
      this.resetLine();this.saluteAnimation?.cancel();this.sparkAnimation?.cancel();
      for(const animation of this.letterAnimations.values())animation.cancel();this.letterAnimations.clear();
      for(const animation of this.entryAnimations.values())animation.cancel();this.entryAnimations.clear();
      this.scene.querySelectorAll('.home-entry').forEach(entry=>{entry.style.removeProperty('--entry-x');entry.style.removeProperty('--entry-y');});
    }
  };
})();
