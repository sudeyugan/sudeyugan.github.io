/* Xiaoyu: original Yiyu artwork, rendered locally. No AI or app access. */
(() => {
  'use strict';
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const images=new Map();
  function image(name){
    if(!images.has(name)){
      const value=new Image();value.src=`./assets/xiaoyu/${name}.png`;images.set(name,value);
    }
    return images.get(name);
  }
  const mobileFrames=[
    [56,0,332,519],[442,0,332,519],[795,0,332,519],[1178,0,332,519],
    [55,519,346,505],[439,540,342,464],[794,540,342,464],[1178,540,342,464],
  ];
  // Reuse the original closed-eye artwork; never paint generic replacement eyes.
  function withBlink(renderer,source){
    const closed=image('sleep');
    if(!closed.complete||!closed.naturalWidth)return source;
    if(!renderer.expression){renderer.expression=document.createElement('canvas');renderer.expression.width=1024;renderer.expression.height=1536;renderer.expressionContext=renderer.expression.getContext('2d');}
    const ctx=renderer.expressionContext;if(!ctx)return source;
    ctx.clearRect(0,0,1024,1536);ctx.drawImage(source,0,0);
    const targets=renderer.pose==='neutral'?[[465,489,-.3],[638,421,-.35]]:[[471,487,-.3],[644,426,-.35]];
    const centers=[[471,487],[644,426]];
    targets.forEach(([x,y,angle],i)=>{
      ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.beginPath();ctx.ellipse(0,0,64,44,0,0,Math.PI*2);ctx.clip();ctx.rotate(-angle);
      ctx.drawImage(closed,centers[i][0]-80,centers[i][1]-65,160,130,-80,-65,160,130);ctx.restore();
    });
    return renderer.expression;
  }
  class PetRenderer{
    constructor(canvas,isReduced){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.isReduced=isReduced;this.pose='neutral';this.format='desktop';this.gaze={x:0,y:0};this.tracking=new DesktopPetTracking(canvas);this.suspended=false;this.active=false;this.ready=false;this.nextBlink=performance.now()+2800;this.blinkUntil=0;this.last=0;this.frame=this.frame.bind(this);image('neutral');image('mobile');image('sleep');if(this.ctx)requestAnimationFrame(this.frame);}
    setActive(active){this.active=active;if(!active){this.tracking.clear(true);this.suspended=false;}}
    frame(now){
      requestAnimationFrame(this.frame);
      if(document.hidden||!this.active||now-this.last<33)return;this.last=now;
      const reduced=this.isReduced();
      if(now>this.nextBlink){this.blinkUntil=now+140;this.nextBlink=now+2700+Math.random()*2600;}
      const name=this.format==='mobile'?'mobile':this.pose;
      const source=image(name);if(!source.complete||!source.naturalWidth)return;
      if(!this.ready){this.ready=true;this.canvas.parentElement.querySelector('img')?.setAttribute('hidden','');}
      const ctx=this.ctx,w=this.canvas.width,h=this.canvas.height;
      ctx.clearRect(0,0,w,h);
      if(this.format==='mobile'){
        let index=0;
        if(this.pose==='wave')index=4;
        else if(this.pose==='sleep')index=6;
        else if(this.pose==='chin')index=5;
        else if(!reduced&&now<this.blinkUntil)index=1;
        const [sx,sy,sw,sh]=mobileFrames[index],scale=Math.min(w*.84/sw,h*.94/519);
        const dw=sw*scale,dh=sh*scale;
        const breath=reduced?0:Math.sin(now*.0018)*h*.0018;
        ctx.imageSmoothingEnabled=true;
        ctx.drawImage(source,sx,sy,sw,sh,(w-dw)/2,h*.98-dh+breath,dw,dh);
      }else{
        const scale=Math.min(w*.96/source.naturalWidth,h*.96/source.naturalHeight);
        const dw=source.naturalWidth*scale,dh=source.naturalHeight*scale;
        const left=(w-dw)/2,top=h*.98-dh;
        this.gaze=this.tracking.update(now,{left,top,scale,width:w,height:h},this.pose,this.suspended,reduced);
        const drawing=!reduced&&this.pose!=='sleep'&&now<this.blinkUntil?withBlink(this,source):this.tracking.paint(source,this.pose);
        const phase=reduced?0:now*.0015;
        ctx.imageSmoothingEnabled=false;
        // Connected strips keep the original silhouette; no detached head or limbs.
        for(let row=0;row<source.naturalHeight;row+=6){
          const sy=row/source.naturalHeight;
          const hair=Math.sin(Math.PI*sy)*Math.sin(phase+sy*3)*1.7;
          const offset=reduced?0:hair;
          const breath=reduced?0:Math.sin(phase*1.2)*1.1*(1-sy);
          const height=Math.min(6,source.naturalHeight-row);
          ctx.drawImage(drawing,0,row,source.naturalWidth,height,left+offset,top+row*scale+breath,dw,height*scale+.4);
        }
      }
    }
  }
  window.Xiaoyu=class{
    constructor(isReduced,onState){
      this.isReduced=isReduced;this.onState=onState;this.actor=document.querySelector('#pet-actor');this.space=document.querySelector('#pet-space');
      this.renderer=new PetRenderer(document.querySelector('#pet-canvas'),isReduced);
      this.mode='webm';this.view='hello';this.actor.dataset.renderer='webm';
      this.actor.querySelector('.pet-static').src='./assets/xiaoyu/webm/poster.png';
      this.videoPlayer=new VideoCompanion(document.querySelector('#pet-video'),isReduced,()=>this.actor.querySelector('.pet-static').hidden=true,()=>{this.onState('WebM 暂时无法播放，可以切换桌面小鱼。');});
      this.position={x:0,y:0,tx:0,ty:0,vx:0,vy:0};this.drag=null;this.reaction=0;this.poseTimer=0;this.state='neutral';
      this.library=document.querySelector('#action-library');document.body.appendChild(this.library);this.libraryToggle=document.querySelector('.action-library-toggle');this.bindTracking();this.bindDrag();this.bindActions();this.last=0;this.loop=this.loop.bind(this);requestAnimationFrame(this.loop);
      window.addEventListener('resize',()=>{this.reset();if(!this.library.hidden)this.placeLibrary();});
      window.addEventListener('scroll',()=>{if(!this.library.hidden)this.setLibrary(false);},{passive:true});
      this.speech=document.querySelector('#pet-speech');
      const initial=()=>{if(this.state==='neutral'){this.say(window.HOME_CONTENT.copy['pet.initialSpeech'],window.HOME_CONTENT.copy['pet.initialDetail']);this.onState(window.HOME_CONTENT.copy['pet.initialState']);}};initial();window.addEventListener('site:content',initial);
    }
    visible(view){if(view!=='xiaoyu'){this.setLibrary(false);clearTimeout(this.holdTimer);this.drag=null;this.waveGesture=null;}this.view=view;this.renderer.setActive(view==='xiaoyu'&&this.mode==='desktop');this.videoPlayer.setActive(view==='xiaoyu'&&this.mode==='webm');}
    bindTracking(){
      document.addEventListener('pointermove',e=>{if(this.renderer.active)this.renderer.tracking.capture(e);},{passive:true});
      document.addEventListener('pointerout',e=>{if(!e.relatedTarget)this.renderer.tracking.clear();});
      window.addEventListener('blur',()=>this.renderer.tracking.clear());
      document.addEventListener('visibilitychange',()=>{if(document.hidden)this.renderer.tracking.clear(true);});
      window.addEventListener('site:motion',()=>this.renderer.tracking.clear(true));
    }
    bounds(){
      const width=this.space.clientWidth,height=this.space.clientHeight,actor=this.actor;
      return {minX:-actor.offsetLeft+15-actor.clientWidth*.2,maxX:width-actor.offsetLeft-actor.clientWidth*.8-15,minY:45-actor.offsetTop,maxY:height-actor.offsetTop-actor.clientHeight+15};
    }
    bindDrag(){
      this.actor.addEventListener('pointerdown',e=>{
        if(e.button!==0)return;
        e.preventDefault();this.actor.setPointerCapture(e.pointerId);this.renderer.suspended=true;
        const r=this.actor.getBoundingClientRect();
        this.drag={id:e.pointerId,startX:e.clientX,startY:e.clientY,region:(e.clientY-r.top)/r.height<.34?'head':'body',x:this.position.tx,y:this.position.ty,lastX:e.clientX,lastY:e.clientY,last:performance.now(),moved:false};this.position.vx=this.position.vy=0;
        clearTimeout(this.holdTimer);this.actor.classList.add('is-holding');
        this.holdTimer=setTimeout(()=>{
          if(!this.drag||this.drag.moved)return;
          this.drag.held=true;this.actor.classList.remove('is-holding');this.trigger('stretch','hold');
        },720);
      });
      this.actor.addEventListener('pointermove',e=>{
        if(!this.drag)return;
        const d=this.drag,b=this.bounds(),dx=e.clientX-d.startX,dy=e.clientY-d.startY;
        if(Math.hypot(dx,dy)>7){d.moved=true;clearTimeout(this.holdTimer);this.actor.classList.remove('is-holding');}
        if(!d.moved)return;
        this.position.tx=clamp(d.x+dx,b.minX,Math.max(b.minX,b.maxX));this.position.ty=clamp(d.y+dy,b.minY,Math.max(b.minY,b.maxY));
        const now=performance.now(),elapsed=Math.max(12,now-d.last);
        this.position.vx=clamp((e.clientX-d.lastX)/elapsed*12,-13,13);this.position.vy=clamp((e.clientY-d.lastY)/elapsed*12,-10,10);
        d.lastX=e.clientX;d.lastY=e.clientY;d.last=now;
      });
      const release=e=>{
        if(!this.drag)return;
        const {moved,held,region}=this.drag;this.drag=null;this.renderer.suspended=false;clearTimeout(this.holdTimer);this.actor.classList.remove('is-holding');
        if(e.type!=='pointerup')return;
        if(!moved&&!held)this.trigger(region==='head'?'pat':'shy',region);
        if(moved){this.trigger('celebrate','drag');this.say('搬好啦。这个新位置，我喜欢。','为一点小小的变化，庆祝一下。');}
      };
      this.actor.addEventListener('pointerup',release);this.actor.addEventListener('pointercancel',release);this.actor.addEventListener('lostpointercapture',release);
      this.actor.addEventListener('keydown',e=>{
        if(e.key==='Enter'||e.key===' '){e.preventDefault();this.trigger(e.shiftKey?'shy':'pat',e.shiftKey?'body':'head');}
        if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
          e.preventDefault();const b=this.bounds();this.position.tx=clamp(this.position.tx+(e.key==='ArrowRight'?15:e.key==='ArrowLeft'?-15:0),b.minX,Math.max(b.minX,b.maxX));this.position.ty=clamp(this.position.ty+(e.key==='ArrowDown'?15:e.key==='ArrowUp'?-15:0),b.minY,Math.max(b.minY,b.maxY));
        }
      });
      this.space.addEventListener('pointermove',e=>{
        if(this.drag||e.pointerType==='touch'||this.view!=='xiaoyu'||this.state!=='neutral'||document.documentElement.dataset.demo==='listening'||document.documentElement.dataset.demo==='speaking')return;
        const now=performance.now();
        if(now-(this.lastGesture||0)<2400)return;
        if(!this.waveGesture||now-this.waveGesture.start>1500){this.waveGesture={start:now,x:e.clientX,direction:0,turns:0};return;}
        const g=this.waveGesture,dx=e.clientX-g.x;if(Math.abs(dx)<22)return;
        const direction=Math.sign(dx);if(g.direction&&direction!==g.direction)g.turns++;
        g.x=e.clientX;g.direction=direction;
        if(g.turns>=3){this.waveGesture=null;this.trigger('wave','wave');}
      });
      this.space.addEventListener('pointerleave',()=>this.waveGesture=null);
      document.querySelectorAll('[data-gesture]').forEach(button=>button.addEventListener('click',()=>this.trigger(button.dataset.gesture,{pat:'head',shy:'body',stretch:'hold',wave:'wave',celebrate:'drag'}[button.dataset.gesture])));
      document.querySelector('.reset-pet').addEventListener('click',()=>{this.reset();this.say('好啦，回到熟悉的位置。','不过，换个地方也很好。');});
    }
    placeLibrary(){
      const anchor=this.libraryToggle.getBoundingClientRect(),header=document.querySelector('.site-header').offsetHeight,footer=document.querySelector('.site-footer').offsetHeight;
      const width=Math.min(Math.max(280,anchor.width),390,innerWidth-40);
      Object.assign(this.library.style,{position:'fixed',right:'auto',bottom:'auto',width:width+'px',minWidth:'0',maxHeight:Math.max(150,innerHeight-header-footer-24)+'px',overflowY:'auto',zIndex:'110'});
      const height=this.library.offsetHeight,left=clamp(anchor.right-width,20,innerWidth-width-20),top=clamp(anchor.top-height-12,header+10,Math.max(header+10,innerHeight-footer-height-12));
      this.library.style.left=left+'px';this.library.style.top=top+'px';
    }
    setLibrary(open,returnFocus=false){
      if(!this.library)return;
      this.library.hidden=!open;this.libraryToggle.setAttribute('aria-expanded',String(open));
      if(open){
        this.placeLibrary();
        if(!this.isReduced())this.library.animate([{opacity:0,transform:'translateY(17px) rotate(2deg) scale(.97)'},{opacity:1,transform:'translateY(0) rotate(0) scale(1)'}],{duration:480,easing:'cubic-bezier(.16,1,.3,1)'});
        this.library.querySelector('[data-action]').focus({preventScroll:true});
      }else if(returnFocus)this.libraryToggle.focus({preventScroll:true});
    }
    bindActions(){
      this.libraryToggle.addEventListener('click',()=>this.setLibrary(this.library.hidden));
      this.library.querySelector('.action-library-close').addEventListener('click',()=>this.setLibrary(false,true));
      document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!this.library.hidden){event.preventDefault();event.stopImmediatePropagation();this.setLibrary(false,true);}});
      document.addEventListener('site:video-state',event=>{
        if(event.detail.state==='idle'&&this.mode==='webm'){
          this.state='neutral';document.documentElement.dataset.petMood='idle';document.querySelectorAll('[data-action]').forEach(button=>{button.classList.remove('is-current');button.setAttribute('aria-pressed','false');});
          this.onState(window.HOME_CONTENT.copy['pet.initialState']);
        }
      });
      document.querySelectorAll('[data-action]').forEach(button=>button.addEventListener('click',()=>this.act(button.dataset.action)));
      document.querySelectorAll('[data-format]').forEach(button=>button.addEventListener('click',()=>{
        this.setLibrary(false);this.mode=button.dataset.format;document.querySelectorAll('[data-webm-only]').forEach(el=>el.hidden=this.mode!=='webm');this.actor.dataset.renderer=this.mode;this.renderer.format='desktop';this.renderer.pose='neutral';this.state='neutral';clearTimeout(this.poseTimer);this.reset();
        document.querySelectorAll('[data-format]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
        this.actor.querySelector('.pet-static').src=this.mode==='webm'?'./assets/xiaoyu/webm/poster.png':'./assets/xiaoyu/neutral.png';
        this.actor.querySelector('.pet-static').hidden=this.mode==='desktop'?this.renderer.ready:!!this.videoPlayer.current;
        document.querySelector('.pet-format-note').textContent=this.mode==='desktop'?'移动鼠标，她会望向你指的位置。':'原项目的真实角色素材 · 网页独立演示';
        if(this.mode==='webm')this.videoPlayer.desired='idle';this.visible(this.view);this.say(this.mode==='webm'?'换一种形象，也还是小鱼。':'小小的我，也认真陪着你。','WebM 形象与桌面小鱼，来自同一个一隅。');
        document.querySelectorAll('[data-action]').forEach(b=>b.classList.remove('is-current'));
      }));
    }
    say(text,detail){
      this.speech.replaceChildren(document.createTextNode(text));const sub=document.createElement('span');sub.textContent=detail;this.speech.append(sub);
      if(!this.isReduced())this.speech.animate([{opacity:0,transform:'translateY(7px) rotate(-1deg)'},{opacity:1,transform:'translateY(0) rotate(-3deg)'}],{duration:500,easing:'cubic-bezier(.16,1,.3,1)'});
    }
    trigger(action,gesture){
      this.lastGesture=performance.now();this.actor.dataset.gesture=gesture;this.waveGesture=null;
      document.querySelectorAll('[data-gesture]').forEach(button=>{button.classList.toggle('is-reacting',button.dataset.gesture===action);});
      clearTimeout(this.gestureTimer);this.gestureTimer=setTimeout(()=>document.querySelectorAll('[data-gesture]').forEach(button=>button.classList.remove('is-reacting')),1800);
      this.act(action);
    }
    act(action){
      document.dispatchEvent(new Event('site:pet-interaction'));
      clearTimeout(this.poseTimer);this.state=action;document.documentElement.dataset.petMood=action;
      this.renderer.pose=action==='wave'?'wave':action==='sleep'?'sleep':'chin';
      document.querySelectorAll('[data-action]').forEach(b=>{b.classList.toggle('is-current',b.dataset.action===action);b.setAttribute('aria-pressed',String(b.dataset.action===action));});
      const words=window.HOME_CONTENT.actions[action];this.say(words.speech,words.detail);this.onState(words.state);
      if(this.mode==='webm')this.videoPlayer.show(words.video||'idle');
      if(action==='wave')this.reaction=1;
      if(action==='pat'){this.hearts();this.reaction=1.5;}
      if(this.mode==='desktop'&&action!=='sleep')this.poseTimer=setTimeout(()=>{this.state='neutral';this.renderer.pose='neutral';document.querySelectorAll('[data-action]').forEach(b=>b.classList.remove('is-current'));},action==='wave'?3200:2800);
    }
    demo(state){
      clearTimeout(this.poseTimer);this.renderer.pose=state==='listening'?'chin':state==='hair'?'chin':'wave';
      if(this.mode==='webm')this.videoPlayer.show(state);
      this.say(state==='listening'?'我在听。慢慢说。':'让一句话，接到真实的日常里。','这是预设的能力片段，不读取私人数据。');
      this.onState(state==='listening'?'场景演示：倾听与理解':'场景演示：回应与动作');
    }
    endDemo(){this.renderer.pose='neutral';if(this.mode==='webm')this.videoPlayer.show('idle');}
    hearts(){
      const layer=document.querySelector('.pet-particles'),rect=this.actor.getBoundingClientRect(),space=this.space.getBoundingClientRect();
      const count=this.isReduced()?1:7;
      for(let i=0;i<count;i++){
        const heart=document.createElement('span');heart.textContent=i%3?'♡':'✳';heart.style.left=`${rect.left-space.left+rect.width*.5+(Math.random()-.5)*70}px`;heart.style.top=`${rect.top-space.top+rect.height*.25}px`;layer.append(heart);
        if(this.isReduced())setTimeout(()=>heart.remove(),700);
        else heart.animate([{opacity:0,transform:'translate(0,0) scale(.4)'},{opacity:1,offset:.15},{opacity:0,transform:`translate(${(Math.random()-.5)*130}px,${-100-Math.random()*80}px) rotate(${Math.random()*80-40}deg) scale(1.1)`}],{duration:1300+i*65,delay:i*55,easing:'cubic-bezier(.15,.5,.3,1)'}).finished.then(()=>heart.remove());
      }
    }
    reset(){this.renderer.tracking.clear(true);this.position.tx=this.position.ty=this.position.vx=this.position.vy=0;}
    loop(now){
      requestAnimationFrame(this.loop);if(document.hidden||this.view!=='xiaoyu'||now-this.last<16)return;this.last=now;
      const p=this.position,reduced=this.isReduced();
      if(!this.drag&&(Math.abs(p.vx)>.1||Math.abs(p.vy)>.1)){
        const b=this.bounds();p.tx=clamp(p.tx+p.vx,b.minX,Math.max(b.minX,b.maxX));p.ty=clamp(p.ty+p.vy,b.minY,Math.max(b.minY,b.maxY));p.vx*=.89;p.vy*=.89;
      }
      p.x=reduced?p.tx:p.x+(p.tx-p.x)*.2;p.y=reduced?p.ty:p.y+(p.ty-p.y)*.2;
      this.reaction*=.94;
      const tilt=reduced?0:(this.drag?clamp(p.vx*.55,-6,6):Math.sin(now*.007)*this.reaction*1.5);
      this.actor.style.transform=`translate3d(${p.x}px,${p.y}px,0) rotate(${tilt}deg)`;
      document.querySelector('#pet-x').textContent=Math.round(p.x);document.querySelector('#pet-y').textContent=Math.round(p.y);
    }
  };
})();
