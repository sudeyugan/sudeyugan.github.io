/* Bounded particle typography, driven by the local song's measured bands. */
(() => {
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const noise=n=>{const s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s);};
  window.LyricField=class {
    constructor(stage,audio){
      this.stage=stage;this.audio=audio;this.canvas=document.createElement('canvas');this.canvas.className='lyric-particles';this.canvas.setAttribute('aria-hidden','true');stage.prepend(this.canvas);
      this.ctx=this.canvas.getContext('2d');this.mask=document.createElement('canvas');this.maskContext=this.mask.getContext('2d',{willReadFrequently:true});this.points=[];this.pointer={x:-9999,y:-9999};this.levels=Array(6).fill(0);this.burst=null;
    }
    rebuild(focus,form,snap){
      if(!this.ctx||!this.maskContext)return false;
      const bounds=this.stage.getBoundingClientRect(),r=focus.getBoundingClientRect();if(bounds.width<10||bounds.height<10||r.width<1)return false;
      this.width=bounds.width;this.height=bounds.height;this.form=form;this.start=this.audio.currentTime;this.snap=snap;this.last=0;
      const dpr=Math.min(devicePixelRatio||1,1.75),w=Math.ceil(this.width),h=Math.ceil(this.height);this.canvas.width=Math.ceil(w*dpr);this.canvas.height=Math.ceil(h*dpr);this.ctx.setTransform(dpr,0,0,dpr,0,0);
      this.mask.width=w;this.mask.height=h;const m=this.maskContext,css=getComputedStyle(focus);m.font=`${css.fontStyle} ${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;m.textBaseline='alphabetic';
      const metrics=m.measureText(focus.textContent),line=parseFloat(css.lineHeight)||r.height,baseline=r.top-bounds.top+(line+metrics.actualBoundingBoxAscent-metrics.actualBoundingBoxDescent)/2;m.fillText(focus.textContent,r.left-bounds.left,baseline);
      const data=m.getImageData(0,0,w,h).data,targets=[],area=r.width*r.height,limit=w<600?1800:4300,step=Math.max(w<600?1.85:2.3,Math.sqrt(area/limit)*.65);
      for(let y=Math.max(0,r.top-bounds.top);y<Math.min(h,r.bottom-bounds.top);y+=step)for(let x=Math.max(0,r.left-bounds.left-2);x<Math.min(w,r.right-bounds.left+2);x+=step)if(data[(Math.floor(y)*w+Math.floor(x))*4+3]>100)targets.push({x,y});
      const stride=Math.max(1,Math.ceil(targets.length/limit)),chosen=targets.filter((_,i)=>i%stride===0).sort((a,b)=>a.x-b.x||a.y-b.y),old=this.points;
      this.points=chosen.map((target,i)=>{
        const seed=noise(i+17),prior=old[Math.floor(i/Math.max(1,chosen.length)*old.length)],tx=target.x+(seed-.5)*step*.32,ty=target.y+(noise(i+503)-.5)*step*.32;
        const x=snap?tx:prior?.x??this.width*(.12+.76*seed),y=snap?ty:prior?.y??this.height*(.2+.6*noise(i+81));
        return {tx,ty,x,y,fromX:x,fromY:y,vx:0,vy:0,seed,band:i%6,size:(w<600?1.1:1.75)+seed*.55,group:i%3};
      });
      this.stage.classList.toggle('has-particle-type',this.points.length>0);this.draw(performance.now(),true);return this.points.length>0;
    }
    point(event){const r=this.stage.getBoundingClientRect();this.pointer={x:event.clientX-r.left,y:event.clientY-r.top};}
    release(){this.pointer={x:-9999,y:-9999};}
    tap(event){this.point(event);this.burst={x:this.pointer.x,y:this.pointer.y,start:performance.now()};}
    draw(now,instant=false){
      if(!this.ctx||!this.width)return;
      const ctx=this.ctx,w=this.width,h=this.height,t=this.audio.currentTime,playing=!this.audio.paused&&!this.audio.ended,dt=clamp((now-(this.last||now-16.67))/16.67,.4,2);this.last=now;
      const signal=window.musicBandLevels?.(t)||Array(6).fill(0),gain=Math.sqrt(this.audio.volume);if(playing||instant)for(let i=0;i<6;i++)this.levels[i]+=(signal[i]*gain-this.levels[i])*(instant?1:.16);
      ctx.clearRect(0,0,w,h);this.landscape(ctx,t);
      const age=this.snap?1:clamp((t-this.start)/1.05,0,1),ease=1-Math.pow(1-age,3),radius=w<600?52:88,burstAge=this.burst?(now-this.burst.start)/850:2;
      const palette=this.form==='fall'?['#aa654c','#bd8061','#655f56']:['#365fc0','#6081bb','#395e67'];
      for(let group=0;group<3;group++){
        ctx.beginPath();
        for(const p of this.points){
          if(p.group!==group)continue;
          const energy=this.levels[p.band],drift=playing||instant?Math.sin(t*1.5+p.tx*.018+p.seed*4)*energy:0;
          let x=p.fromX+(p.tx-p.fromX)*ease+drift*2.4,y=p.fromY+(p.ty-p.fromY)*ease+drift*(this.form==='mountains'?4:2.8);
          if(this.form==='fall')y+=energy*6*Math.sin(t*1.8+p.seed);if(this.form==='rise')y-=energy*6;
          const dx=x-this.pointer.x,dy=y-this.pointer.y,distance=Math.hypot(dx,dy);if(distance<radius&&distance>.01){const push=Math.pow(1-distance/radius,2)*34;x+=dx/distance*push;y+=dy/distance*push;}
          if(burstAge<1){const bx=x-this.burst.x,by=y-this.burst.y,d=Math.hypot(bx,by),ring=burstAge*160,force=Math.exp(-Math.pow((d-ring)/32,2))*(1-burstAge)*20;x+=bx/(d||1)*force;y+=by/(d||1)*force;}
          if(instant){p.x=x;p.y=y;p.vx=p.vy=0;}else{p.vx=(p.vx+(x-p.x)*.1*dt)*Math.pow(.72,dt);p.vy=(p.vy+(y-p.y)*.1*dt)*Math.pow(.72,dt);p.x+=p.vx*dt;p.y+=p.vy*dt;}
          const size=p.size*(1+energy*.22);ctx.rect(p.x-size/2,p.y-size/2,size,size);
        }
        ctx.fillStyle=palette[group];ctx.globalAlpha=[1,.82,.92][group];ctx.fill();
      }
      ctx.globalAlpha=1;
    }
    landscape(ctx,t){
      const w=this.width,h=this.height,chorus=this.form==='mountains',rows=chorus?9:5,columns=40;
      const vertex=(column,row)=>{
        const u=column/columns,depth=row/(rows-1),perspective=.58+depth*.42;
        const peak=chorus?Math.exp(-Math.pow((u-.35)/.13,2))+Math.exp(-Math.pow((u-.68)/.095,2))*.75:Math.sin(u*Math.PI)*.32;
        const band=Math.min(5,Math.floor(u*6)),wave=Math.sin(u*11+t*.65+depth*.9)*this.levels[band]*4;
        return [w/2+(u-.5)*w*.98*perspective,h*(.77+depth*.16)-peak*(chorus?32:15)*(1-depth*.35)-wave];
      };
      ctx.lineWidth=.65;ctx.strokeStyle='#5f7e9b';
      for(let row=0;row<rows;row++){
        ctx.beginPath();for(let column=0;column<=columns;column++){const [x,y]=vertex(column,row);if(column)ctx.lineTo(x,y);else ctx.moveTo(x,y);}
        ctx.globalAlpha=.11-row*.006;ctx.stroke();
      }
      if(chorus)for(let column=0;column<=columns;column+=2){ctx.beginPath();for(let row=0;row<rows;row++){const [x,y]=vertex(column,row);if(row)ctx.lineTo(x,y);else ctx.moveTo(x,y);}ctx.globalAlpha=.065;ctx.stroke();}
      ctx.globalAlpha=1;
    }
  };
})();
