/* A small projected scene: wood grain, brass rims, separate rods and damped motion. */
(() => {
  'use strict';
  const TAU=Math.PI*2,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
  const hash=n=>{const x=Math.sin(n*127.1+31.7)*43758.5453;return x-Math.floor(x);};
  window.FortuneRitual=class {
    constructor(canvas,isReduced){
      Object.assign(this,{canvas,ctx:canvas.getContext('2d'),isReduced,active:false,holding:false,drawing:false,frame:0,angle:0,velocity:0,look:0,target:0,started:performance.now(),last:0});
      this.rods=Array.from({length:25},(_,i)=>{const a=i*2.399963,r=Math.sqrt((i+.5)/25)*43;return {x:Math.cos(a)*r,z:Math.sin(a)*r,h:196+hash(i)*37,lean:(hash(i+20)-.5)*.12};});
      this.draw=this.draw.bind(this);this.observer=new ResizeObserver(()=>{this.resize();this.paint(performance.now());this.wake();});this.observer.observe(canvas);
      this.motion=()=>{this.stop();this.paint(performance.now());this.wake();};addEventListener('site:motion',this.motion);
      document.addEventListener('visibilitychange',()=>document.hidden?this.stop():this.wake());
    }
    resize(){this.w=this.canvas.clientWidth;this.h=this.canvas.clientHeight;if(!this.w||!this.h||!this.ctx)return;const d=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.round(this.w*d);this.canvas.height=Math.round(this.h*d);this.ctx.setTransform(d,0,0,d,0,0);}
    stop(){cancelAnimationFrame(this.frame);this.frame=0;this.last=0;}
    setActive(active){this.active=active;if(!active)this.stop();else{this.resize();this.paint(performance.now());this.wake();}}
    reset(){this.drawing=false;this.holding=false;this.angle=0;this.velocity=0;this.started=performance.now();this.paint(this.started);this.wake();}
    hold(on){this.holding=on;this.started=performance.now();this.wake();}
    pointer(x){this.target=clamp(x,-1,1)*.14;this.started=performance.now();this.wake();}
    drawLot(id){this.holding=false;this.drawing=true;this.lot=id;this.drawStart=performance.now();this.started=this.drawStart;this.wake();}
    wake(){if(this.active&&!document.hidden&&!this.isReduced()&&!this.frame)this.frame=requestAnimationFrame(this.draw);}
    draw(now){this.frame=0;const dt=Math.min(2,(now-(this.last||now-16.7))/16.7);this.last=now;const target=this.holding?Math.sin(now*.022)*.095:0;this.velocity+=(target-this.angle)*.13*dt;this.velocity*=Math.pow(.79,dt);this.angle+=this.velocity*dt;this.look+=(this.target-this.look)*.07;this.paint(now);if(this.holding||this.drawing&&now-this.drawStart<2800||now-this.started<1500||Math.abs(this.velocity)>.0003)this.wake();}
    paint(now){
      const c=this.ctx,w=this.w,h=this.h;if(!c||!w||!h)return;c.clearRect(0,0,w,h);const reduced=this.isReduced(),elapsed=this.drawing?(now-this.drawStart)/1000:0,lift=this.drawing?smooth((elapsed-.35)/1.25)*110:0;
      const pullback=this.drawing?smooth((elapsed-.2)/1.15):0;
      const yaw=-.13+(reduced?0:this.look),roll=reduced?0:this.angle,pitch=.28,scale=Math.min(w/350,h/350)*.90*(1-pullback*.24),cx=w*.5,cy=h*(.66+pullback*.08);
      const project=(x,y,z)=>{const xx=x*Math.cos(yaw)+z*Math.sin(yaw),zz=-x*Math.sin(yaw)+z*Math.cos(yaw),rx=xx*Math.cos(roll)-y*Math.sin(roll),ry=xx*Math.sin(roll)+y*Math.cos(roll),yy=ry*Math.cos(pitch)-zz*Math.sin(pitch),depth=ry*Math.sin(pitch)+zz*Math.cos(pitch),f=680/(680-depth);return {x:cx+rx*f*scale,y:cy-yy*f*scale,z:depth};};
      const shadow=project(0,-93,0);c.save();c.translate(shadow.x,shadow.y+13);c.scale(1,.24);const shade=c.createRadialGradient(0,0,8,0,0,105*scale);shade.addColorStop(0,'#3d412a38');shade.addColorStop(1,'#3d412a00');c.fillStyle=shade;c.beginPath();c.arc(0,0,105*scale,0,TAU);c.fill();c.restore();
      const faces=[],add=(v,material,extra={})=>{const p=v.map(a=>project(...a));faces.push({p,depth:p.reduce((a,b)=>a+b.z,0)/p.length,material,...extra});};
      const color=(base,norm,grain=0)=>{const light=clamp(norm[0]*-.45+norm[1]*.55+norm[2]*.8),k=.57+light*.58+grain;return `rgb(${base.map(v=>Math.round(clamp(v*k,0,255))).join(',')})`;};
      const tube=(radius,y1,y2,base,kind)=>{for(let i=0;i<80;i++){const a=i/80*TAU,b=(i+1)/80*TAU,mid=(a+b)/2,n=[Math.cos(mid),0,Math.sin(mid)],v=[[Math.cos(a)*radius,y1,Math.sin(a)*radius],[Math.cos(b)*radius,y1,Math.sin(b)*radius],[Math.cos(b)*radius,y2,Math.sin(b)*radius],[Math.cos(a)*radius,y2,Math.sin(a)*radius]];add(v,color(base,n,(hash(i)*.025-.0125)),{kind,seed:i});}};
      tube(70,-88,68,[148,102,57],'wood');tube(71,-83,-78,[167,140,84],'brass');tube(71,63,68,[173,146,92],'brass');
      // Deep, hollow mouth and the rounded lip, rather than a flat painted ellipse.
      add(Array.from({length:80},(_,i)=>[Math.cos(i/80*TAU)*60,43,Math.sin(i/80*TAU)*60]),'#302b20');
      tube(60,43,68,[80,63,39],'inner');
      for(let i=0;i<80;i++){const a=i/80*TAU,b=(i+1)/80*TAU;add([[Math.cos(a)*70,68,Math.sin(a)*70],[Math.cos(b)*70,68,Math.sin(b)*70],[Math.cos(b)*60,68,Math.sin(b)*60],[Math.cos(a)*60,68,Math.sin(a)*60]],color([176,144,90],[Math.cos(a)*.3,.8,Math.sin(a)*.3]));}
      for(const [i,rod]of this.rods.entries()){
        const selected=i===12&&this.drawing,raised=selected?lift:0,shake=reduced?0:(this.angle*.6+Math.sin(now*.024+i)*Math.abs(this.angle)*.32),lean=rod.lean+shake;
        const position=(x,y,z)=>{const relY=y+75;return [rod.x+x+relY*lean+(selected?smooth((elapsed-1.1)/1)*22:0),y+raised,rod.z+z+(selected?smooth((elapsed-.5)/1)*90:0)];};
        const lo=-75,hi=rod.h,half=3.2;
        for(const [bottom,top]of [[lo,68-raised],[68-raised,hi]])for(let side=0;side<4;side++){const a=side*TAU/4+Math.PI/4,b=a+TAU/4;add([position(Math.cos(a)*half,bottom,Math.sin(a)*half),position(Math.cos(b)*half,bottom,Math.sin(b)*half),position(Math.cos(b)*half,top,Math.sin(b)*half),position(Math.cos(a)*half,top,Math.sin(a)*half)],color([210,181,124],[Math.cos(a+.7),.2,Math.sin(a+.7)]),{kind:'bamboo',seed:i});}
        add([position(-2,hi,0),position(2,hi,0),position(2,hi-22,0),position(-2,hi-22,0)],selected?'#9d4a35':'#a66c4150');
        if(selected){const point=project(...position(0,hi-8,5));faces.push({depth:point.z+2,label:this.lot,point});}
      }
      const plaque=[[-22,42,70],[22,42,70],[22,-48,70],[-22,-48,70]].map(a=>project(...a));faces.push({p:plaque,depth:plaque.reduce((s,p)=>s+p.z,0)/4+.3,plaque:true});
      faces.sort((a,b)=>a.depth-b.depth);
      for(const face of faces){
        if(face.label){c.fillStyle='#a64f38';c.font='9px Georgia,serif';c.textAlign='center';c.fillText(face.label,face.point.x,face.point.y);continue;}
        const p=face.p;c.beginPath();p.forEach((v,i)=>i?c.lineTo(v.x,v.y):c.moveTo(v.x,v.y));c.closePath();
        if(face.plaque){c.save();c.transform((p[1].x-p[0].x)/44,(p[1].y-p[0].y)/44,(p[3].x-p[0].x)/90,(p[3].y-p[0].y)/90,p[0].x,p[0].y);const g=c.createLinearGradient(0,0,44,90);g.addColorStop(0,'#42624c');g.addColorStop(1,'#253f35');c.fillStyle=g;c.fillRect(0,0,44,90);c.strokeStyle='#bda879';c.lineWidth=.5;c.strokeRect(3,3,38,84);c.textAlign='center';c.fillStyle='#d8c495';c.font='8px serif';c.fillText('随 心',22,19);c.font='31px Georgia,"Noto Serif CJK SC",serif';c.fillText('签',22,58);c.font='5px serif';c.fillText('苏 的 鱼 干',22,77);c.restore();continue;}
        c.fillStyle=face.material;c.fill();c.strokeStyle=face.material;c.lineWidth=.55;c.stroke();
        if(face.kind==='wood'||face.kind==='bamboo'){c.save();c.clip();c.strokeStyle=face.kind==='wood'?'#4e321d30':'#fff3c338';c.lineWidth=.4;const x=(p[0].x+p[1].x)*.5,y=(p[0].y+p[1].y)*.5,bx=(p[2].x+p[3].x)*.5,by=(p[2].y+p[3].y)*.5;c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+Math.sin(face.seed)*2,y+(by-y)*.35,bx-1,by-(by-y)*.22,bx,by);c.stroke();c.restore();}
      }
      if(this.drawing&&elapsed>1.2){const alpha=smooth((elapsed-1.2)/.7)*(1-smooth((elapsed-2.25)/.5));c.save();c.globalAlpha=alpha;const g=c.createRadialGradient(cx,Math.max(25,cy-270*scale),0,cx,Math.max(25,cy-270*scale),80);g.addColorStop(0,'#f8e6b45c');g.addColorStop(1,'#f8e6b400');c.fillStyle=g;c.fillRect(0,0,w,h);c.restore();}
    }
  };
})();
