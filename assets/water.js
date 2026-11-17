/* Local current: a moving water-surface disturbance, elastic edges, and a boat that yields.
   Everything follows a nearby gesture; there is no animated page-wide surface. */
(() => {
  'use strict';
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const svgNS='http://www.w3.org/2000/svg';
  const svgNode=(tag,attributes={})=>{const node=document.createElementNS(svgNS,tag);for(const [key,value] of Object.entries(attributes))node.setAttribute(key,value);return node;};
  // A world-anchored height field. Only its moving viewport follows the pointer.
  // Disturbances stay where the fish swam and travel across neighboring cells.
  class WakeField {
    constructor(width,height){
      this.width=width;this.height=height;this.cell=2;this.cols=width/this.cell;this.rows=height/this.cell;
      const count=this.cols*this.rows;
      this.heightNow=new Float32Array(count);this.heightBefore=new Float32Array(count);
      this.shiftNow=new Float32Array(count);this.shiftBefore=new Float32Array(count);
      this.absorb=new Float32Array(count);
      for(let y=0;y<this.rows;y++)for(let x=0;x<this.cols;x++)this.absorb[y*this.cols+x]=.9+.1*clamp(Math.min(x,y,this.cols-1-x,this.rows-1-y)/10,0,1);
      this.buffer=document.createElement('canvas');this.buffer.width=this.cols;this.buffer.height=this.rows;
      this.context=this.buffer.getContext('2d');this.image=this.context?.createImageData(this.cols,this.rows);
      this.reset();
    }
    reset(){
      this.heightNow.fill(0);this.heightBefore.fill(0);this.origin=null;this.source=null;
      this.energy=0;this.lastInput=0;this.accumulator=0;this.lastPaint=0;this.active=false;
    }
    place(point){
      const origin={x:Math.floor((point.x-this.width/2)/this.cell)*this.cell,y:Math.floor((point.y-this.height/2)/this.cell)*this.cell};
      if(this.origin){
        const dx=(origin.x-this.origin.x)/this.cell,dy=(origin.y-this.origin.y)/this.cell;
        if(dx||dy){
          this.shiftNow.fill(0);this.shiftBefore.fill(0);
          if(Math.abs(dx)<this.cols&&Math.abs(dy)<this.rows){
            const left=Math.max(0,-dx),right=Math.min(this.cols,this.cols-dx),top=Math.max(0,-dy),bottom=Math.min(this.rows,this.rows-dy);
            for(let y=top;y<bottom;y++){
              const from=(y+dy)*this.cols+left+dx,to=y*this.cols+left;
              this.shiftNow.set(this.heightNow.subarray(from,from+right-left),to);
              this.shiftBefore.set(this.heightBefore.subarray(from,from+right-left),to);
            }
          }
          [this.heightNow,this.shiftNow]=[this.shiftNow,this.heightNow];
          [this.heightBefore,this.shiftBefore]=[this.shiftBefore,this.heightBefore];
        }
      }
      this.origin=origin;
    }
    add(x,y,heading,strength){
      const gx=(x-this.origin.x)/this.cell,gy=(y-this.origin.y)/this.cell;
      const ux=Math.cos(heading),uy=Math.sin(heading),radius=7;
      for(let py=Math.max(1,Math.floor(gy-radius));py<Math.min(this.rows-1,gy+radius);py++)for(let px=Math.max(1,Math.floor(gx-radius));px<Math.min(this.cols-1,gx+radius);px++){
        const dx=px-gx,dy=py-gy,along=dx*ux+dy*uy,across=-dx*uy+dy*ux;
        const rear=Math.exp(-((along-1.8)**2/9+across*across/12));
        const front=Math.exp(-((along+1.8)**2/9+across*across/12));
        const displacement=(rear-front)*strength,i=py*this.cols+px;
        this.heightNow[i]=clamp(this.heightNow[i]+displacement,-1,1);
        this.heightBefore[i]=clamp(this.heightBefore[i]+displacement*.55,-1,1);
      }
    }
    trace(point,angle,now){
      this.place(point);
      const source={x:point.x+Math.cos(angle)*19,y:point.y+Math.sin(angle)*19,time:now};
      if(this.source){
        const dx=source.x-this.source.x,dy=source.y-this.source.y,distance=Math.hypot(dx,dy),elapsed=Math.max(12,now-this.source.time);
        if(distance>200){this.reset();this.place(point);}
        // Space input in both distance and time; keep the simulation itself smooth.
        else if(distance>=4.8&&elapsed>=28){
          const steps=Math.min(8,Math.ceil(distance/6)),heading=Math.atan2(dy,dx),strength=clamp(.17+distance/elapsed*.12,.17,.34);
          for(let i=1;i<=steps;i++)this.add(this.source.x+dx*i/steps,this.source.y+dy*i/steps,heading,strength);
          this.active=true;this.lastInput=now;this.source=source;
        }
      }else this.source=source;
    }
    tap(point,now){
      this.place(point);
      const gx=(point.x-this.origin.x)/this.cell,gy=(point.y-this.origin.y)/this.cell,radius=9;
      for(let y=Math.max(1,Math.floor(gy-radius));y<Math.min(this.rows-1,gy+radius);y++)for(let x=Math.max(1,Math.floor(gx-radius));x<Math.min(this.cols-1,gx+radius);x++){
        const distance=((x-gx)**2+(y-gy)**2)/13;
        // A soft depression with a raised rim, rendered by the same water normals.
        const displacement=(distance-1)*Math.exp(-distance)*.34,i=y*this.cols+x;
        this.heightNow[i]=clamp(this.heightNow[i]+displacement,-1,1);
        this.heightBefore[i]=clamp(this.heightBefore[i]+displacement*.25,-1,1);
      }
      this.active=true;this.lastInput=now;this.lastPaint=0;
    }
    step(){
      const a=this.heightNow,b=this.heightBefore,w=this.cols,h=this.rows;let energy=0;
      for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
        const i=y*w+x,lap=a[i-1]+a[i+1]+a[i-w]+a[i+w]-4*a[i];
        b[i]=(a[i]+(a[i]-b[i])*.90+lap*.31)*this.absorb[i];energy+=b[i]*b[i];
      }
      this.heightNow=b;this.heightBefore=a;this.energy=energy;
    }
    paint(){
      if(!this.context)return;
      const a=this.heightNow,w=this.cols,h=this.rows,p=this.image.data;p.fill(0);
      for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
        const i=y*w+x,gx=a[i-1]-a[i+1],gy=a[i-w]-a[i+w],slope=Math.hypot(gx,gy);
        if(slope<.0035)continue;
        const light=clamp((gx*.62-gy*.78)*10,-1,1),shine=Math.max(0,light),opacity=clamp((slope-.0035)*3.8,0,.38),at=i*4;
        p[at]=Math.round(87+(255-87)*shine);p[at+1]=Math.round(136+(255-136)*shine);p[at+2]=Math.round(128+(246-128)*shine);
        p[at+3]=Math.round(opacity*255);
      }
      this.context.putImageData(this.image,0,0);
    }
    draw(ctx,point,now,dt){
      if(!this.active||!this.origin)return false;
      this.place(point);this.accumulator+=dt;
      while(this.accumulator>=.5){this.step();this.accumulator-=.5;}
      if((this.energy<.00005&&now-this.lastInput>400)||now-this.lastInput>850){this.reset();return false;}
      if(now-this.lastPaint>=25){this.paint();this.lastPaint=now;}
      ctx.imageSmoothingEnabled=true;
      ctx.drawImage(this.buffer,this.origin.x-point.x+this.width/2,this.origin.y-point.y+this.height/2,this.width,this.height);
      return true;
    }
  }
  window.WaterSurface=class {
    constructor(isReduced){
      this.isReduced=isReduced;this.canvas=document.querySelector('#water-surface');this.ctx=this.canvas.getContext('2d');
      this.width=320;this.height=256;this.point=null;this.measure=null;this.frame=0;this.lastFrame=0;
      this.flow=new WakeField(this.width,this.height);
      this.heading=0;this.hover=null;this.down=false;this.records=[];this.byElement=new Map();
      this.fine=matchMedia('(hover:hover) and (pointer:fine)');this.follower=document.querySelector('.pointer-follower');
      document.documentElement.dataset.water='current';
      this.draw=this.draw.bind(this);this.resize();
      for(const element of document.querySelectorAll('.portal,.fragment-card,.hello-postcard'))this.register(element,'card');
      for(const element of document.querySelectorAll('.underlined-link,.scene-nav a,.opener-tabs button,.about-word,.postcard-flip'))this.register(element,'link');
      this.boat=document.querySelector('.paper-boat');this.boatButton=document.querySelector('.contact-current');
      this.boatMotion={x:0,y:0,vx:0,vy:0};
      this.boatButton?.addEventListener('click',()=>{
        if(this.isReduced())return;
        this.boatMotion.vx+=(this.point&&this.point.x>this.boat.getBoundingClientRect().left?-1:1)*4;
        this.boatMotion.vy-=2.8;this.wake();
      });
      document.addEventListener('pointermove',event=>this.move(event),{passive:true});
      document.addEventListener('pointerdown',event=>{
        if(!this.enabled(event)){if(event.pointerType==='touch')this.clear();return;}
        this.place(event.clientX,event.clientY);this.down=true;
        if(this.hover)this.impulse(this.hover,3);
        this.flow.tap(this.point,performance.now());
        this.wake();
      },{passive:true});
      document.addEventListener('pointerup',()=>{this.down=false;this.wake();},{passive:true});
      document.addEventListener('pointercancel',()=>this.clear());
      document.addEventListener('pointerleave',()=>this.clear());
      addEventListener('blur',()=>this.clear());
      addEventListener('resize',()=>{this.clear();this.resize();});
      this.fine.addEventListener('change',()=>this.clear());
      addEventListener('scroll',()=>this.clear(),{capture:true,passive:true});
      addEventListener('site:motion',()=>this.clear());
      document.addEventListener('visibilitychange',()=>{if(document.hidden)this.clear();});
    }
    enabled(event){return this.ctx&&this.fine.matches&&!this.isReduced()&&!document.hidden&&event.pointerType!=='touch'&&!event.target.closest('input,textarea,select,[contenteditable=true]');}
    resize(){
      this.ratio=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.round(this.width*this.ratio);this.canvas.height=Math.round(this.height*this.ratio);
    }
    register(element,kind){
      const record={element,kind,positions:new Float32Array(35),velocities:new Float32Array(35),near:false,contact:0,at:.5,side:'bottom',u:0,v:0,settled:true};
      this.records.push(record);this.byElement.set(element,record);element.classList.add('current-'+kind);this.decorate(record);
    }
    decorate(record){
      if(record.svg?.isConnected)return;
      const svg=svgNode('svg',{'class':'current-edge','aria-hidden':'true','focusable':'false'}),ink=svgNode('path',{'class':'current-edge-ink'}),light=svgNode('path',{'class':'current-edge-light'});
      svg.append(light,ink);record.element.append(svg);record.svg=svg;record.ink=ink;record.light=light;
      if(record.kind==='card'&&!record.sheen){const sheen=document.createElement('span');sheen.className='current-sheen';sheen.setAttribute('aria-hidden','true');record.element.append(sheen);record.sheen=sheen;}
    }
    place(x,y){this.point={x,y};this.canvas.style.transform=`translate3d(${x-this.width/2}px,${y-this.height/2}px,0)`;}
    move(event){
      if(!this.enabled(event)){this.clear();return;}
      const now=performance.now(),old=this.point;this.place(event.clientX,event.clientY);
      if(old&&Math.hypot(this.point.x-old.x,this.point.y-old.y)>240)this.flow.reset();
      const angle=(parseFloat(this.follower.style.getPropertyValue('--fish-angle'))||0)*Math.PI/180;
      this.flow.trace(this.point,angle,now);
      this.lastMove=now;this.selectContact(event.target);this.wake();
    }
    selectContact(target){
      if(target.closest('#pet-actor,.name-glyph')&&this.down){this.releaseContact();return;}
      let element=target.closest('.current-link,.current-card'),record=this.byElement.get(element);
      if(!record){
        let nearest=48;
        for(const candidate of this.records){
          if(candidate.kind!=='card'||candidate.element.closest('[inert],[aria-hidden=true]'))continue;
          const r=candidate.element.getBoundingClientRect();if(!r.width||!r.height)continue;
          const distance=Math.hypot(Math.max(r.left-this.point.x,0,this.point.x-r.right),Math.max(r.top-this.point.y,0,this.point.y-r.bottom));
          if(distance<nearest){record=candidate;nearest=distance;}
        }
      }
      if(this.hover!==record){this.releaseContact();this.hover=record||null;if(record){record.near=true;record.element.classList.add('is-current-near');this.decorate(record);this.impulse(record,.8);}}
      if(record){
        const r=record.element.getBoundingClientRect(),w=record.element.offsetWidth,h=record.element.offsetHeight;
        const x=clamp((this.point.x-r.left)/r.width*w,0,w),y=clamp((this.point.y-r.top)/r.height*h,0,h);
        record.u=x;record.v=y;
        record.element.style.setProperty('--current-x',x+'px');record.element.style.setProperty('--current-y',y+'px');
        if(record.kind==='link'){record.side='bottom';record.at=clamp(x/w,0,1);record.contact=1;}
        else{
          const edges=[['left',x],['right',w-x],['top',y],['bottom',h-y]].sort((a,b)=>a[1]-b[1]);
          const [side,distance]=edges[0];
          if(record.side!==side){record.positions.fill(0);record.velocities.fill(0);record.side=side;}
          record.at=side==='top'||side==='bottom'?x/w:y/h;record.contact=clamp(1-distance/70,.05,1);
        }
        record.settled=false;
      }
      const boatRect=this.boat?.getBoundingClientRect();
      const nearBoat=boatRect&&Math.hypot(this.point.x-(boatRect.left+boatRect.width/2),this.point.y-(boatRect.top+boatRect.height/2))<88&&document.documentElement.dataset.view==='contact';
      this.boatNear=!!nearBoat;
      this.follower.dataset.affinity=nearBoat?'boat':record?.kind||'free';

    }
    releaseContact(){
      if(this.hover){this.hover.near=false;this.hover.contact=0;this.hover.settled=false;this.hover.element.classList.remove('is-current-near');}
      this.hover=null;
    }
    impulse(record,strength){
      const at=Math.round(record.at*(record.positions.length-1));
      for(let i=1;i<record.positions.length-1;i++)record.velocities[i]+=Math.exp(-Math.pow((i-at)/4,2))*strength;
      record.settled=false;
    }
    wake(){if(!this.frame&&!this.isReduced()&&!document.hidden)this.frame=requestAnimationFrame(this.draw);}
    clear(){
      cancelAnimationFrame(this.frame);this.frame=0;this.point=null;this.measure=null;this.flow.reset();this.down=false;this.boatNear=false;
      this.releaseContact();
      for(const record of this.records){record.positions.fill(0);record.velocities.fill(0);record.settled=true;record.svg?.removeAttribute('style');record.element.classList.remove('is-current-near');}
      this.boatMotion.x=this.boatMotion.y=this.boatMotion.vx=this.boatMotion.vy=0;
      this.boat?.style.removeProperty('translate');if(this.follower)this.follower.dataset.affinity='free';
      this.ctx?.clearRect(0,0,this.canvas.width,this.canvas.height);
    }
    updateEdges(dt){
      let moving=false;
      for(const record of this.records){
        if(record.settled)continue;
        const p=record.positions,v=record.velocities,n=p.length;let energy=0;
        for(let i=1;i<n-1;i++){
          const target=record.near?-record.contact*4.8*Math.exp(-Math.pow((i/(n-1)-.5)/.24,2)):0;
          v[i]=(v[i]+((p[i-1]+p[i+1]-2*p[i])*.13+(target-p[i])*.07)*dt)*Math.pow(.77,dt);
          p[i]=clamp(p[i]+v[i]*dt,-9,9);energy+=Math.abs(v[i]);
        }
        const w=record.element.offsetWidth,h=record.element.offsetHeight,horizontal=record.side==='bottom'||record.side==='top';
        const length=record.kind==='link'?w-4:horizontal?w-12:h-12;
        const span=Math.min(record.kind==='link'?180:154,Math.max(1,length)),center=clamp((horizontal?record.u:record.v),span/2+2,(horizontal?w:h)-span/2-2),start=center-span/2;
        let d='';
        for(let i=0;i<n;i++){
          const along=start+span*i/(n-1);let x,y;
          if(record.side==='bottom'){x=along;y=h-2+p[i];}
          else if(record.side==='top'){x=along;y=2-p[i];}
          else if(record.side==='left'){x=2-p[i];y=along;}
          else{x=w-2+p[i];y=along;}
          d+=(i?'L':'M')+x.toFixed(2)+' '+y.toFixed(2);
        }
        record.svg.setAttribute('viewBox',`0 0 ${w} ${h}`);record.ink.setAttribute('d',d);record.light.setAttribute('d',d);
        record.settled=energy<.006;moving||=!record.settled;
      }
      return moving;
    }
    updateBoat(dt){
      if(!this.boat)return false;
      const b=this.boatMotion;let tx=0,ty=0;
      if(this.boatNear&&this.point){
        const r=this.boat.getBoundingClientRect(),dx=r.left+r.width/2-this.point.x,dy=r.top+r.height/2-this.point.y,d=Math.max(1,Math.hypot(dx,dy)),power=clamp(1-d/110,0,1);
        tx=dx/d*22*power;ty=dy/d*9*power-2*power;
      }
      b.vx=(b.vx+(tx-b.x)*.065*dt)*Math.pow(.81,dt);b.vy=(b.vy+(ty-b.y)*.065*dt)*Math.pow(.81,dt);
      b.x=clamp(b.x+b.vx*dt,-28,28);b.y=clamp(b.y+b.vy*dt,-12,12);
      this.boat.style.translate=`${b.x.toFixed(2)}px ${b.y.toFixed(2)}px`;
      return Math.abs(b.vx)+Math.abs(b.vy)+Math.abs(tx-b.x)+Math.abs(ty-b.y)>.035;
    }
    drawWake(now,dt){
      return !!this.point&&this.flow.draw(this.ctx,this.point,now,dt);
    }
    draw(now){
      this.frame=0;if(this.isReduced()||document.hidden){this.clear();return;}
      const dt=clamp((now-(this.lastFrame||now-16.67))/16.67,.5,2);this.lastFrame=now;
      const edgeMoving=this.updateEdges(dt),boatMoving=this.updateBoat(dt);
      let wakeMoving=false;const c=this.ctx;if(c){
        c.clearRect(0,0,this.canvas.width,this.canvas.height);
        if(this.point){c.save();c.globalAlpha=.88;c.scale(this.ratio,this.ratio);c.beginPath();c.ellipse(this.width/2,this.height/2,154,121,0,0,Math.PI*2);c.clip();wakeMoving=this.drawWake(now,dt);c.restore();}
      }
      if(wakeMoving||edgeMoving||boatMoving)this.wake();
    }
  };
})();
