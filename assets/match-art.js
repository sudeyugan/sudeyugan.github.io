/* Coupled phase oscillators. Only the aggregate score enters the kinetic artwork. */
(() => {
  'use strict';
  const TAU=Math.PI*2,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const ease=t=>1-(1-clamp(t))**3,smooth=t=>{t=clamp(t);return t*t*(3-2*t);},hash=n=>{const x=Math.sin(n*127.1+17.7)*43758.5453;return x-Math.floor(x);};
  const COLORS=[[62,116,91],[178,134,76]];
  window.MatchArt=class {
    constructor(canvas,isReduced,onProgress){
      Object.assign(this,{canvas,ctx:canvas.getContext('2d'),isReduced,onProgress,active:false,frame:0,mode:'fortune',data:{},started:performance.now(),last:0,lastPaint:0,phase:[.3,2.6],speed:[.75,1.12],kick:0,kickTarget:0,sync:0,pointer:{x:0,y:0},target:{x:0,y:0},particles:[],paused:false});
      this.draw=this.draw.bind(this);
      this.observer=new ResizeObserver(()=>{this.resize();this.paint(performance.now());this.wake();});this.observer.observe(canvas);
      const stage=canvas.parentElement;
      stage.addEventListener('pointermove',e=>{if(this.mode==='fortune'||e.pointerType==='touch')return;const r=canvas.getBoundingClientRect();this.target.x=clamp((e.clientX-r.left)/r.width-.5,-.5,.5);this.target.y=clamp((e.clientY-r.top)/r.height-.5,-.5,.5);if(this.mode!=='question')this.wake();},{passive:true});
      stage.addEventListener('pointerleave',()=>{this.target={x:0,y:0};this.wake();});
      stage.addEventListener('pointerdown',e=>{if(this.mode!=='welcome'||e.button!==0||e.target.closest('button,a'))return;this.nudge();});
      document.addEventListener('visibilitychange',()=>{this.last=0;if(document.hidden)this.stop();else this.wake();});
      addEventListener('site:motion',()=>{this.stop();this.paint(performance.now());this.wake();});
    }
    resize(){const w=this.canvas.clientWidth,h=this.canvas.clientHeight;if(!w||!h||!this.ctx)return;this.w=w;this.h=h;const d=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.round(w*d);this.canvas.height=Math.round(h*d);this.ctx.setTransform(d,0,0,d,0,0);}
    stop(){cancelAnimationFrame(this.frame);this.frame=0;this.last=0;}
    setActive(active){this.active=active;if(!active)this.stop();else{this.resize();this.paint(performance.now());this.wake();}}
    set(mode,data={}){
      const old=this.mode;this.mode=mode;this.data={score:data.score,total:data.total,compared:data.compared,demo:data.demo,pendingOwner:data.pendingOwner,answered:data.answered};this.started=performance.now();this.paused=false;this.last=0;this.kick=0;this.kickTarget=0;this.sync=0;
      if(mode==='result'&&old!=='result'){this.phase=[-.65,2.35];this.speed=[.72,1.3];}
      if(mode==='fortune'){this.particles=[];this.stop();}
      this.resize();this.paint(this.started);this.wake();
    }
    togglePause(){this.paused=!this.paused;if(this.paused)this.stop();else this.wake();return this.paused;}
    nudge(){
      if(this.mode==='fortune'||this.isReduced()||this.data.score===null||this.paused)return;
      // A bounded force, not a position change. Velocity and trail separation ease in together.
      this.kickTarget=Math.min(3,this.kickTarget+2.1);this.wake();
    }
    select(rect){
      if(this.isReduced())return;const r=this.canvas.getBoundingClientRect(),origin={x:rect.left-r.left+rect.width/2,y:rect.top-r.top+rect.height/2},now=performance.now();
      for(let i=0;i<34;i++)this.particles.push({born:now,ox:origin.x+(hash(i)*2-1)*rect.width*.35,oy:origin.y+(hash(i+50)*2-1)*12,delay:hash(i+5)*110,bend:(hash(i+7)-.5)*160,size:.7+hash(i+9)*1.1});this.wake();
    }
    wake(){if(this.active&&this.mode!=='fortune'&&!this.frame&&!document.hidden&&!this.isReduced()&&!this.paused)this.frame=requestAnimationFrame(this.draw);}
    draw(now){
      this.frame=0;
      if(now-this.lastPaint<32){this.wake();return;}
      const dt=Math.min(.05,(now-(this.last||now-33))/1000);this.last=now;this.lastPaint=now;
      this.pointer.x+=(this.target.x-this.pointer.x)*.08;this.pointer.y+=(this.target.y-this.pointer.y)*.08;
      if(this.mode!=='question')this.integrate(dt,now);
      this.paint(now);
      if(this.mode!=='question'||now-this.started<1000||this.particles.length)this.wake();
    }
    integrate(dt,now){
      if(!Number.isFinite(dt)||dt<=0)return;dt=Math.min(dt,.05);
      const reveal=this.mode==='result'?ease((now-this.started-250)/2200):0,score=this.data.score??.4;
      const coupling=this.mode==='result'?(.1+score*1.35)*reveal:.035,detune=this.mode==='result'?(1-score)*1.75:.6,delta=this.phase[1]-this.phase[0];
      this.kickTarget*=Math.exp(-dt*2.1);this.kick+=(this.kickTarget-this.kick)*(1-Math.exp(-dt*7.5));
      const target=[clamp(.72+coupling*Math.sin(delta)-this.kick*.35,.08,3),clamp(.72+detune-coupling*Math.sin(delta)+this.kick*2.2,.08,3)];
      const inertia=1-Math.exp(-dt*6);this.speed=this.speed.map((v,i)=>v+(target[i]-v)*inertia);
      this.phase[0]+=this.speed[0]*dt;this.phase[1]+=this.speed[1]*dt;
      const gap=Math.abs(Math.atan2(Math.sin(delta),Math.cos(delta))),closeness=1-smooth((gap-.08)/.85),pace=1-smooth(Math.abs(this.speed[1]-this.speed[0])/.9);
      const affinity=smooth((score-.4)/.5),desired=this.mode==='result'&&this.data.score!==null?affinity*closeness*pace*reveal*(1-clamp(this.kick*.65)):0;
      this.sync+=(desired-this.sync)*(1-Math.exp(-dt*2.5));
    }
    bounds(){const stage=this.canvas.parentElement,view=stage.querySelector('.resonance-viewport');if(!view)return {x:0,y:0,w:this.w,h:this.h};const a=stage.getBoundingClientRect(),b=view.getBoundingClientRect();return {x:b.left-a.left,y:b.top-a.top+stage.scrollTop,w:b.width,h:b.height};}
    paint(now){
      if(!this.ctx||!this.w||!this.h)return;const c=this.ctx;c.clearRect(0,0,this.w,this.h);if(this.mode==='fortune')return;
      const time=this.isReduced()?4500:Math.max(0,now-this.started);
      if(this.mode==='question'){this.questionField(c,time);this.paintSelections(c,now);return;}
      this.orbits(c,this.bounds(),time);
      if(this.mode==='result')this.onProgress?.(this.isReduced()?1:ease((time-950)/2150));
    }
    point(angle,side,layout,score,offset=0){
      const spread=(1-score)*.22,theta=angle+side*spread,r=layout.r+offset;
      let x=Math.cos(theta)*r,y=Math.sin(theta)*r*layout.squash,z=Math.sin(theta)*r*.52;
      const tilt=.06+(side?1:-1)*(1-score)*.11+this.pointer.x*.12,rx=y*Math.sin(tilt)+x*Math.cos(tilt);y=y*Math.cos(tilt)-x*Math.sin(tilt);x=rx;
      y+=z*this.pointer.y*.16;const f=700/(700-z*.35);
      return {x:layout.cx+x*f,y:layout.cy+y*f,z};
    }
    lightState(score,still=false,empty=false){
      const ratio=(1-score)*1.75/(2*(.1+score*1.35)),restGap=ratio<1?Math.asin(ratio):2.3;
      const raw=still?[.3,.3+(empty?2.5:this.mode==='welcome'?1.4:restGap)]:this.phase;
      const gap=Math.atan2(Math.sin(raw[1]-raw[0]),Math.cos(raw[1]-raw[0])),close=1-smooth((Math.abs(gap)-.08)/.85);
      const coherence=still?smooth((score-.4)/.5)*close:this.sync;
      // Never blend across antipodal phases: this also avoids a circular-midpoint wrap jump.
      const merge=empty||this.mode!=='result'?0:coherence*(1-smooth((Math.abs(gap)-.55)/.85));
      const phase=[raw[0]+gap*.5*merge*.96,raw[1]-gap*.5*merge*.96],common=.76+.24*Math.sin((raw[0]+gap*.5)*1.8);
      const breath=raw.map(p=>(.84+.16*Math.sin(p*1.8))*(1-merge)+common*merge);
      return {phase,merge,breath,common,score:score+(1-score)*merge};
    }
    orbits(c,box,time=4500,exported=false){
      const {x,y,w,h}=box,score=this.mode==='welcome'?.48:(this.data.score??0),empty=this.mode==='result'&&this.data.score===null,reduced=this.isReduced()||exported;
      const mobile=w<600,layout={cx:x+w*.5,cy:y+h*.5,r:Math.min(w*(mobile?.42:.36),h*(mobile?.64:.89),310),squash:mobile?.72:.48},r=layout.r,reveal=this.mode==='result'?ease(time/1700):ease(time/1300);
      const {phase,merge,breath,common,score:trackScore}=this.lightState(score,reduced,empty);
      c.save();c.globalAlpha=reveal;
      // Etched latitude lines provide depth without a chart, axes, or per-answer marks.
      for(let j=-2;j<=2;j++){c.beginPath();for(let i=0;i<=160;i++){const p=this.point(i/160*TAU,0,layout,.8,j*7);if(!i)c.moveTo(p.x,p.y);else c.lineTo(p.x,p.y);}c.strokeStyle=j===0?'#829c762c':'#9ba88c12';c.lineWidth=j===0?.8:.5;c.stroke();}
      // Both phase fields bend the same translucent filaments: meeting phases reinforce the folds.
      for(let j=0;j<18;j++){
        const side=j%2,color=COLORS[side];c.beginPath();for(let i=0;i<=150;i++){
          const a=i/150*TAU,envelope=Math.cos(a-phase[0])*.5+Math.cos(a-phase[1])*.5;
          const wave=Math.sin(a*6-phase[0])*Math.cos(a*6-phase[1]),off=(j-8.5)*1.25+wave*4+envelope*3;
          const p=this.point(a,side,layout,trackScore,off);p.y+=Math.sin(a*3+j*.18-phase[side])*(mobile?3:6);
          if(!i)c.moveTo(p.x,p.y);else c.lineTo(p.x,p.y);
        }c.lineWidth=.45;c.strokeStyle=empty?'#87937e0a':`rgba(${color},${.025+Math.sin(j/18*Math.PI)*.025})`;c.stroke();
      }
      for(let side=0;side<2;side++){
        c.save();c.globalAlpha*=(1-merge*.58)*breath[side];
        const color=empty?[136,147,127]:COLORS[side],colorText=color.join(','),theta=phase[side],arc=empty?.25:1.85;
        for(let band=0;band<9;band++){
          c.beginPath();for(let i=0;i<=100;i++){const t=i/100,a=theta-arc*(1-t),offset=(band-4)*1.8+Math.sin(a*3+band*.4)*1.9,p=this.point(a,side,layout,trackScore,offset);if(!i)c.moveTo(p.x,p.y);else c.lineTo(p.x,p.y);}
          const a=this.point(theta-arc,side,layout,trackScore),b=this.point(theta,side,layout,trackScore),g=c.createLinearGradient(a.x,a.y,b.x,b.y);g.addColorStop(0,`rgba(${colorText},0)`);g.addColorStop(.45,`rgba(${colorText},${empty?.12:.16})`);g.addColorStop(1,`rgba(${colorText},${band===4?.85:.28})`);c.strokeStyle=g;c.lineWidth=band===4?1.2:.6;c.stroke();
        }
        for(let i=0;i<95;i++){
          const seed=i+side*301,t=hash(seed)*(1-merge)+hash(i)*merge,a=theta-arc*t,jitter=hash(seed+19)*(1-merge)+hash(i+19)*merge,off=(jitter-.5)*(10+t*20),p=this.point(a,side,layout,trackScore,off),alpha=(1-t)*(.15+hash(seed+40)*.35);
          c.fillStyle=`rgba(${colorText},${alpha})`;c.beginPath();c.arc(p.x,p.y,.35+hash(seed+32)*.8,0,TAU);c.fill();
        }
        const head=this.point(theta,side,layout,trackScore),glow=c.createRadialGradient(head.x,head.y,0,head.x,head.y,20);glow.addColorStop(0,`rgba(${colorText},.24)`);glow.addColorStop(1,`rgba(${colorText},0)`);c.fillStyle=glow;c.fillRect(head.x-20,head.y-20,40,40);
        c.beginPath();c.arc(head.x,head.y,4.8+merge*breath[side]*.9,0,TAU);c.fillStyle=`rgb(${colorText})`;c.fill();c.strokeStyle='#faf4dc';c.lineWidth=1.6;c.stroke();
        c.beginPath();c.arc(head.x-1,head.y-1,1.2,0,TAU);c.fillStyle='#faf6e8';c.fill();
        c.restore();
      }
      if(merge>.001){
        const gap=Math.atan2(Math.sin(phase[1]-phase[0]),Math.cos(phase[1]-phase[0])),theta=phase[0]+gap*.5;
        c.save();c.globalAlpha*=merge*common;
        // A shared central filament grows continuously out of the two original trails.
        const tail=this.point(theta-1.85,0,layout,1),head=this.point(theta,0,layout,1),g=c.createLinearGradient(tail.x,tail.y,head.x,head.y);
        g.addColorStop(0,'#6e956800');g.addColorStop(.4,'#6e956866');g.addColorStop(.8,'#a7985dbb');g.addColorStop(1,'#d8bd76ee');
        for(let j=-2;j<=2;j++){c.beginPath();for(let i=0;i<=100;i++){const a=theta-1.85*(1-i/100),p=this.point(a,0,layout,1,j*.9);if(!i)c.moveTo(p.x,p.y);else c.lineTo(p.x,p.y);}c.strokeStyle=g;c.lineWidth=j===0?1.8:.8;c.stroke();}
        const glow=c.createRadialGradient(head.x,head.y,0,head.x,head.y,26);glow.addColorStop(0,'#c7b87550');glow.addColorStop(1,'#c7b87500');c.fillStyle=glow;c.fillRect(head.x-26,head.y-26,52,52);
        c.beginPath();c.arc(head.x,head.y,4.8+common*.9,0,TAU);const core=c.createLinearGradient(head.x-5,head.y-3,head.x+5,head.y+3);core.addColorStop(0,'#507d5f');core.addColorStop(1,'#b38f52');c.fillStyle=core;c.fill();c.strokeStyle='#faf5e0';c.lineWidth=1.4;c.stroke();c.restore();
      }
      // A localized halo is strongest when both phases physically meet.
      if(!empty){const a=this.point(phase[0],0,layout,trackScore),b=this.point(phase[1],1,layout,trackScore),distance=Math.hypot(a.x-b.x,a.y-b.y),strength=clamp(1-distance/(r*.35));if(strength>.05){const cx=(a.x+b.x)/2,cy=(a.y+b.y)/2,g=c.createRadialGradient(cx,cy,0,cx,cy,30);g.addColorStop(0,`rgba(199,168,93,${strength*.18*(1-merge+merge*common)})`);g.addColorStop(1,'#c7a85d00');c.fillStyle=g;c.fillRect(cx-30,cy-30,60,60);}}
      c.restore();
    }
    questionField(c,time){
      const w=this.w,h=this.h,r=Math.min(w*.43,h*.72);c.save();c.strokeStyle='#91a27f13';c.lineWidth=.7;c.beginPath();c.ellipse(w*.5,h*.52,r,r*.48,-.08,0,TAU);c.stroke();c.beginPath();c.ellipse(w*.5,h*.52,r+9,(r+9)*.48,-.08,0,TAU);c.stroke();c.restore();
    }
    paintSelections(c,now){
      this.particles=this.particles.filter(p=>now-p.born-p.delay<850);const tx=this.w*.5,ty=34;
      for(const p of this.particles){const t=clamp((now-p.born-p.delay)/850);if(!t||t===1)continue;const u=ease(t),x=p.ox+(tx-p.ox)*u+Math.sin(t*Math.PI)*p.bend,y=p.oy+(ty-p.oy)*u; c.beginPath();c.arc(x,y,p.size*(1-t*.6),0,TAU);c.fillStyle=`rgba(137,155,101,${Math.sin(t*Math.PI)*.7})`;c.fill();}
    }
    save(label){
      const out=document.createElement('canvas');out.width=1440;out.height=1000;const c=out.getContext('2d');c.fillStyle='#f0eedf';c.fillRect(0,0,1440,1000);
      const originalMode=this.mode;this.mode='result';this.orbits(c,{x:170,y:230,w:1100,h:500},4500,true);this.mode=originalMode;
      c.textAlign='center';c.fillStyle='#7c8d72';c.font='13px sans-serif';c.fillText('A LITTLE RESONANCE / 这次相遇',720,135);c.fillStyle='#3b674e';c.font='italic 112px Georgia';c.fillText(label,720,485);c.font='15px sans-serif';c.fillStyle='#8c967c';c.fillText('这一轮的合拍度',720,535);c.font='13px sans-serif';c.fillText(this.data.demo?'预览分值 · 尚未完整录入本人偏好':this.data.pendingOwner?`本轮 ${this.data.total} 题 · 有效 ${this.data.compared} 题 · ${this.data.pendingOwner} 题待本人补答，未计分`:'苏的鱼干 · 很高兴认识你',720,870);
      out.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='这次相遇.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),15000);});
    }
  };
})();
