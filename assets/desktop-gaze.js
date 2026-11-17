/* Yiyu classic mouse gaze, adapted to the local HTML canvas.
 * attention.ts, animation.ts, art/gazeSampling.ts and art/gazeTexture.ts.
 * The generated patches avoid image readback, including when opened via file://.
 */
(() => {
  'use strict';
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const valid=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  function attention(){
    let anchor=null,lastMove=0,hoverStart,held=null;
    return (now,pointer)=>{
      if(!valid(pointer)){anchor=held=null;hoverStart=undefined;return {pointer:null,settling:true};}
      if(!anchor||distance(pointer,anchor)>1.5){anchor={...pointer};lastMove=now;}
      const hovering=pointer.x>=0&&pointer.x<=192&&pointer.y>=0&&pointer.y<=240;
      if(hovering){
        hoverStart??=now;
        if(now-hoverStart>=300){if(!held||distance(pointer,held)>6)held={...pointer};return {pointer:held,settling:false};}
      }else{hoverStart=undefined;held=null;}
      return now-lastMove>=6000?{pointer:null,settling:true}:{pointer,settling:false};
    };
  }
  function gazeTarget(pointer,eye){
    if(!valid(pointer))return {x:0,y:0};
    const x=(pointer.x-eye.x)/85,y=(pointer.y-eye.y)/100,length=Math.max(1,Math.hypot(x,y));
    return {x:clamp(x/length,-1,1)*3.5,y:clamp(y/length,-1,1)*2};
  }
  function decode(text){return Uint8Array.from(atob(text),char=>char.charCodeAt(0));}
  function prepareIris(spec){
    const {width,height,rx,ry,irisX,irisY,irisRx,irisRy}=spec,original=new Uint8ClampedArray(decode(spec.pixels)),aperture=decode(spec.aperture);
    const iris=new Uint8Array(width*height),whites=[],fallback=[];
    for(let i=0;i<iris.length;i++){
      const p=i*4,r=original[p],g=original[p+1],b=original[p+2],d=((i%width-irisX)/irisRx)**2+((Math.floor(i/width)-irisY)/irisRy)**2;
      const blue=b>r*1.08&&b>=g*.94,white=r>175&&g>175&&b>=r*.985&&Math.abs(r-g)<22,pupil=r<120&&g<130&&b<185;
      iris[i]=Number(aperture[i]&&d<1.18&&(blue||((white||pupil)&&d<.85)));
      if(aperture[i]&&white){fallback.push(i);if(!iris[i])whites.push(i);}
    }
    const background=original.slice(),candidates=whites.length?whites:fallback;
    if(!candidates.length)iris.fill(0);
    for(let i=0;i<iris.length;i++)if(iris[i]&&candidates.length){
      const colour=[0,0,0,0];let sum=0;
      for(const candidate of candidates){const d=(candidate%width-i%width)**2+(Math.floor(candidate/width)-Math.floor(i/width))**2,weight=1/(d+4);sum+=weight;for(let c=0;c<4;c++)colour[c]+=original[candidate*4+c]*weight;}
      for(let c=0;c<4;c++)background[i*4+c]=colour[c]/sum;
    }
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');
    return {...spec,original,background,iris,aperture,output:original.slice(),canvas,ctx,pixels:ctx?.createImageData(width,height)};
  }
  function renderIris(eye,x,y){
    const {width,height,original,background,output,iris,aperture}=eye;
    output.set(original);if((!x&&!y)||!Number.isFinite(x)||!Number.isFinite(y))return output;
    const nx=x/3.5,ny=y/2,length=Math.max(1,Math.hypot(nx,ny)),dx=nx/length*eye.rx*.28,dy=ny/length*eye.ry*.3;
    for(let i=0;i<iris.length;i++)if(aperture[i]){
      const p=i*4,sx=i%width-dx,sy=Math.floor(i/width)-dy,x0=Math.floor(sx),y0=Math.floor(sy),fx=sx-x0,fy=sy-y0;
      let r=0,g=0,b=0,a=0;
      for(let oy=0;oy<=1;oy++)for(let ox=0;ox<=1;ox++){
        const px=x0+ox,py=y0+oy;if(px<0||py<0||px>=width||py>=height)continue;const sample=py*width+px;if(!iris[sample])continue;
        const weight=(ox?fx:1-fx)*(oy?fy:1-fy);a+=weight;r+=original[sample*4]*weight;g+=original[sample*4+1]*weight;b+=original[sample*4+2]*weight;
      }
      output[p]=background[p]*(1-a)+r;output[p+1]=background[p+1]*(1-a)+g;output[p+2]=background[p+2]*(1-a)+b;
    }
    return output;
  }
  window.DesktopPetTracking=class {
    constructor(canvas){
      this.canvas=canvas;this.pointer=null;this.gaze={x:0,y:0};this.focus={pointer:null,settling:true};this.attention=attention();this.cache=new Map();this.last=undefined;
    }
    capture(event){this.pointer=event.pointerType==='touch'?null:{x:event.clientX,y:event.clientY};}
    clear(immediate=false){this.pointer=null;this.attention=attention();this.focus={pointer:null,settling:true};if(immediate){this.gaze.x=this.gaze.y=0;this.last=undefined;}}
    update(now,box,pose,suspended,reduced){
      if(reduced){this.clear(true);this.last=now;return this.gaze;}
      const profile=window.XIAOYU_GAZE_PATCHES?.[pose]||window.XIAOYU_GAZE_PATCHES?.neutral,r=this.canvas.getBoundingClientRect();
      const delta=this.last===undefined?0:clamp(now-this.last,0,100);this.last=now;
      let pointer=null;
      if(this.pointer&&!suspended&&pose!=='sleep'&&r.width&&r.height&&profile){
        pointer={x:(this.pointer.x-r.left)/r.width*192,y:(this.pointer.y-r.top)/r.height*240};
      }
      this.focus=this.attention(now,pointer);
      const centers=profile?.centers||[[465,489],[638,421]],eye={x:(box.left+(centers[0][0]+centers[1][0])*.5*box.scale)/box.width*192,y:(box.top+(centers[0][1]+centers[1][1])*.5*box.scale)/box.height*240};
      const target=gazeTarget(this.focus.pointer,eye),easing=1-Math.exp(-delta/(this.focus.settling?550:110));
      this.gaze.x+=(target.x-this.gaze.x)*easing;this.gaze.y+=(target.y-this.gaze.y)*easing;
      if(Math.abs(this.gaze.x)<.001)this.gaze.x=0;if(Math.abs(this.gaze.y)<.001)this.gaze.y=0;
      return this.gaze;
    }
    prepare(pose){
      if(this.cache.has(pose))return this.cache.get(pose);
      const data=window.XIAOYU_GAZE_PATCHES?.[pose];if(!data)return null;
      const eyes=data.eyes.map(prepareIris);this.cache.set(pose,eyes);return eyes;
    }
    paint(source,pose){
      if(pose==='sleep'||(!this.gaze.x&&!this.gaze.y))return source;
      const eyes=this.prepare(pose);if(!eyes)return source;
      if(!this.working){this.working=document.createElement('canvas');this.working.width=1024;this.working.height=1536;this.ctx=this.working.getContext('2d');}
      if(!this.ctx)return source;
      this.ctx.clearRect(0,0,1024,1536);this.ctx.drawImage(source,0,0);this.ctx.imageSmoothingEnabled=true;
      for(const eye of eyes){if(!eye.ctx||!eye.pixels)continue;eye.pixels.data.set(renderIris(eye,this.gaze.x,this.gaze.y));eye.ctx.putImageData(eye.pixels,0,0);this.ctx.drawImage(eye.canvas,eye.left,eye.top,eye.width*eye.scale,eye.height*eye.scale);}
      return this.working;
    }
  };
})();
