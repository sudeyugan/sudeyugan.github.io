/* Six measured frequency bands, sampled at the actual playback time. */
(() => {
  'use strict';
  window.musicBandLevels=time=>{
    const data=window.MOVE_MOUNTAINS_SPECTRUM;if(!data?.frames?.length)return Array(6).fill(0);
    const last=data.frames.length/6-1,t=Math.max(0,Math.min(time*data.fps,last)),a=Math.floor(t),b=Math.min(a+1,last),fraction=t-a;
    return Array.from({length:6},(_,i)=>(data.frames[a*6+i]*(1-fraction)+data.frames[b*6+i]*fraction)/255);
  };
  window.SoundSculpture=class {
    constructor(audio,button,isReduced){
      this.audio=audio;this.button=button;this.isReduced=isReduced;this.rects=[...button.querySelectorAll('rect')];this.data=window.MOVE_MOUNTAINS_SPECTRUM;
      this.rest=[24,46,61,37,51,28];this.centers=[46,45,42.5,44.5,44.5,47];this.heights=this.rest.slice();this.velocity=Array(6).fill(0);this.active=false;this.frame=0;
      this.draw=this.draw.bind(this);['play','pause','ended','volumechange'].forEach(type=>audio.addEventListener(type,()=>this.wake()));
      addEventListener('site:motion',()=>{this.reset();this.wake();});this.paint();
    }
    setActive(active){this.active=active;if(active)this.wake();else this.reset();}
    levels(){return window.musicBandLevels(this.audio.currentTime);}
    wake(){if(!this.frame&&this.active&&!document.hidden&&!this.isReduced())this.frame=requestAnimationFrame(this.draw);}
    draw(now){this.frame=0;if(!this.active||document.hidden||this.isReduced())return;const dt=Math.max(.5,Math.min(2,(now-(this.last||now-16.67))/16.67));this.last=now;
      const playing=!this.audio.paused&&!this.audio.ended,levels=this.levels(),gain=Math.sqrt(this.audio.volume);let energy=0;
      for(let i=0;i<6;i++){const target=playing?12+levels[i]*62*gain:this.rest[i];this.velocity[i]=(this.velocity[i]+(target-this.heights[i])*.12*dt)*Math.pow(.7,dt);this.heights[i]+=this.velocity[i]*dt;energy+=Math.abs(this.velocity[i])+Math.abs(target-this.heights[i]);}
      this.paint();if(playing||energy>.05)this.wake();else this.reset();
    }
    paint(){this.rects.forEach((r,i)=>{const h=this.heights[i],y=this.centers[i]-h/2;r.setAttribute('height',h.toFixed(2));r.setAttribute('y',y.toFixed(2));const angle=[-9,5,-4,9,-6,7][i]+(h-this.rest[i])*.1;r.setAttribute('transform',`rotate(${angle.toFixed(2)} ${Number(r.getAttribute('x'))+Number(r.getAttribute('width'))/2} ${this.centers[i]})`);});}
    reset(){cancelAnimationFrame(this.frame);this.frame=0;this.last=0;this.heights=this.rest.slice();this.velocity.fill(0);this.paint();}
  };
})();
