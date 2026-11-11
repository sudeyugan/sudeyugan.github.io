/* Continuous motion belongs to interaction, not just page entry. */
(() => {
  'use strict';
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  window.HomeMotion=class {
    constructor(isReduced){
      this.isReduced=isReduced;this.pointer={x:-2000,y:-2000,seen:false};
      this.glyphs=[...document.querySelectorAll('.name-glyph')].map((element,index)=>({element,index,x:0,y:0,r:0,vx:0,vy:0,vr:0,drag:false,dx:0,dy:0}));
      this.name=document.querySelector('.kinetic-name');
      this.follower=document.querySelector('.pointer-follower');
      this.cursor={x:0,y:0};this.velocity={x:0,y:0,angle:0,stretch:1};this.swimAngle=0;this.fine=matchMedia('(hover:hover) and (pointer:fine)');
      this.captureRects();new ResizeObserver(()=>this.captureRects()).observe(this.name);
      this.bindGlyphs();
      document.addEventListener('pointermove',e=>{
        if(e.pointerType==='touch'){this.pointer.seen=false;document.documentElement.classList.remove('has-custom-cursor');return;}
        this.pointer={x:e.clientX,y:e.clientY,seen:true};
        const target=e.target.closest('[data-cursor]'),contact=e.target.closest('.current-card,.current-link');
        const label=target?.dataset.cursor||(contact?.classList.contains('current-card')?'轻轻碰一下':contact?'拨动一下':'');
        this.follower.classList.toggle('has-label',!!label);
        this.follower.querySelector('span').textContent=label;
        this.pointer.native=!!e.target.closest('input,textarea,select,[contenteditable=true]');this.follower.classList.toggle('is-interactive',!!e.target.closest('a,button,.name-glyph'));
      });
      document.addEventListener('pointerdown',event=>{if(event.pointerType==='touch'){this.pointer.seen=false;document.documentElement.classList.remove('has-custom-cursor');return;}this.follower.classList.add('is-down');if(!this.isReduced()&&this.fine.matches){this.follower.querySelector('.cursor-halo').animate([{opacity:.6,scale:.5},{opacity:0,scale:2.3}],{duration:520,easing:'ease-out'});}});
      document.addEventListener('pointerup',()=>this.follower.classList.remove('is-down'));
      document.addEventListener('pointerleave',()=>{this.pointer.seen=false;document.documentElement.classList.remove('has-custom-cursor');});
      window.addEventListener('blur',()=>{this.pointer.seen=false;document.documentElement.classList.remove('has-custom-cursor');});
      this.frame=0;this.loop=this.loop.bind(this);requestAnimationFrame(this.loop);
    }
    captureRects(){
      const rect=this.name.getBoundingClientRect();
      this.glyphs.forEach(g=>{g.cx=rect.left+g.element.offsetLeft+g.element.offsetWidth/2;g.cy=rect.top+g.element.offsetTop+g.element.offsetHeight/2;});
    }
    bindGlyphs(){
      this.glyphs.forEach(g=>{
        g.element.addEventListener('pointerdown',event=>{
          if(this.isReduced())return;
          event.preventDefault();g.drag=true;g.startX=event.clientX-g.x;g.startY=event.clientY-g.y;
          g.dx=g.x;g.dy=g.y;g.lastX=event.clientX;g.lastY=event.clientY;g.lastTime=performance.now();
          g.element.setPointerCapture(event.pointerId);
        });
        g.element.addEventListener('pointermove',event=>{
          if(!g.drag)return;
          g.dx=clamp(event.clientX-g.startX,-180,180);g.dy=clamp(event.clientY-g.startY,-150,150);
          const now=performance.now(),delta=Math.max(10,now-g.lastTime);
          g.throwX=(event.clientX-g.lastX)/delta*13;g.throwY=(event.clientY-g.lastY)/delta*13;
          g.lastX=event.clientX;g.lastY=event.clientY;g.lastTime=now;
        });
        const release=()=>{if(!g.drag)return;g.drag=false;g.vx=clamp(g.throwX||0,-25,25);g.vy=clamp(g.throwY||0,-25,25);};
        g.element.addEventListener('pointerup',release);g.element.addEventListener('pointercancel',release);
        g.element.addEventListener('lostpointercapture',release);
      });
    }
    loop(now){
      requestAnimationFrame(this.loop);
      if(document.hidden||now-this.frame<15)return;this.frame=now;
      const reduced=this.isReduced();
      if(document.documentElement.dataset.view==='hello'){
        this.glyphs.forEach(g=>{
          if(reduced){g.x=g.y=g.r=g.vx=g.vy=g.vr=0;g.element.style.transform='none';return;}
          const dx=g.cx-this.pointer.x,dy=g.cy-this.pointer.y,distance=Math.hypot(dx,dy);
          const strength=this.pointer.seen?Math.max(0,1-distance/230):0;
          const tx=g.drag?g.dx:clamp(dx*.16*strength,-20,20),ty=g.drag?g.dy:clamp(dy*.16*strength,-19,19);
          const stiffness=g.drag?.22:.075,damping=g.drag?.62:.79;
          g.vx=(g.vx+(tx-g.x)*stiffness)*damping;g.vy=(g.vy+(ty-g.y)*stiffness)*damping;
          g.x+=g.vx;g.y+=g.vy;g.vr=(g.vr+((g.x*.075)-g.r)*.07)*.78;g.r+=g.vr;
          const stretch=clamp(g.vx*.002+g.vy*.002,-.045,.045);
          g.element.style.transform=`translate3d(${g.x.toFixed(2)}px,${g.y.toFixed(2)}px,0) rotate(${g.r.toFixed(2)}deg) scale(${1+stretch},${1-stretch})`;
        });
      }
      const custom=this.fine.matches&&this.pointer.seen&&!this.pointer.native&&!reduced;
      document.documentElement.classList.toggle('has-custom-cursor',custom);
      if(custom){
        const vx=this.pointer.x-this.cursor.x,vy=this.pointer.y-this.cursor.y,speed=Math.hypot(vx,vy);
        this.cursor.x=this.pointer.x;this.cursor.y=this.pointer.y;
        // Accumulate the shortest turn in radians. JavaScript's negative remainder
        // used to reset the fish after it had swum several complete circles.
        if(speed>1.5){
          const heading=Math.atan2(vy,vx)+Math.PI;
          if(this.heading===undefined){this.heading=heading;this.targetAngle=heading;this.swimAngle=heading*180/Math.PI;}
          else{this.targetAngle+=Math.atan2(Math.sin(heading-this.heading),Math.cos(heading-this.heading));this.heading=heading;}
        }
        if(this.targetAngle!==undefined)this.swimAngle+=clamp((this.targetAngle*180/Math.PI-this.swimAngle)*.22,-20,20);
        this.velocity.stretch+=(clamp(1+speed*.007,1,1.22)-this.velocity.stretch)*.22;
        this.follower.style.transform=`translate3d(${this.cursor.x}px,${this.cursor.y}px,0)`;
        this.follower.style.setProperty('--fin-duration',Math.max(.2,.85-(this.velocity.stretch-1)*3)+'s');
        this.follower.style.setProperty('--fish-angle',this.swimAngle+'deg');this.follower.style.setProperty('--fish-stretch',this.velocity.stretch);this.follower.style.opacity='1';
      }else this.follower.style.opacity='0';
    }
    refreshName(){
      const elements=[...this.name.querySelectorAll('.name-glyph')];
      if(elements.length===this.glyphs.length&&elements.every((el,i)=>el===this.glyphs[i].element))return;
      this.glyphs=elements.map((element,index)=>({element,index,x:0,y:0,r:0,vx:0,vy:0,vr:0,drag:false,dx:0,dy:0}));this.captureRects();this.bindGlyphs();
    }
    enter(scene){
      this.captureRects();
      if(this.isReduced())return;
      const targets=[...scene.querySelectorAll('.scene-kicker,.name-prelude,.name-annotation,.hello-statement,.portal,.word-selector,.about-story,.pet-description,.pet-space,.pet-interaction,.contact-heading,.contact-right,.scene-aside')];
      targets.forEach((element,index)=>element.animate([
        {opacity:0,transform:'translate3d(0,35px,0) skewY(2deg)',clipPath:'inset(0 0 100% 0)'},
        {opacity:1,transform:'translate3d(0,0,0) skewY(0)',clipPath:'inset(0 0 0 0)'},
      ],{duration:850,delay:Math.min(index*65,325),easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'}));
      if(scene.id==='scene-hello')this.glyphs.forEach((g,i)=>{g.y=65+i*22;g.r=(i-1.5)*8;g.vy=-3;});
    }
    updateStory(){
      if(this.isReduced())return;
      const story=document.querySelector('.about-story');
      story.animate([{opacity:0,transform:'translateX(25px) rotate(2deg)'},{opacity:1,transform:'translateX(0) rotate(0)'}],{duration:600,easing:'cubic-bezier(.16,1,.3,1)'});
      document.querySelector('#story-path').animate([{strokeDashoffset:520},{strokeDashoffset:0}],{duration:1150,easing:'cubic-bezier(.16,1,.3,1)'});
    }
  };
})();
