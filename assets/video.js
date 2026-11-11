/* Two video slots retain the current visual until the next clip presents a frame. */
(() => {
  'use strict';
  window.VideoCompanion=class{
    constructor(element,isReduced,onReady,onError){
      const second=element.cloneNode(true);second.removeAttribute('id');element.after(second);
      this.nodes=[element,second];this.isReduced=isReduced;this.onReady=onReady;this.onError=onError;
      this.current=null;this.active=false;this.desired='idle';this.revision=0;
      for(const node of this.nodes){node.muted=true;node.playsInline=true;node.preload='metadata';}
      addEventListener('site:motion',()=>{if(this.current){if(this.isReduced())this.current.pause();else if(this.active)this.current.play().catch(()=>{});}});
      document.addEventListener('visibilitychange',()=>{if(document.hidden)this.nodes.forEach(node=>node.pause());else if(this.active&&!this.isReduced())this.current?.play().catch(()=>{});});
    }
    setActive(active){this.active=active;if(!active){this.nodes.forEach(node=>node.pause());return;}this.show(this.desired);}
    show(state='idle'){
      this.desired=state;if(!this.active)return;
      if(this.current?.dataset.state===state&&this.current.readyState>=2){if(!this.isReduced())this.current.play().catch(()=>{});return;}
      const token=++this.revision,next=this.nodes.find(node=>node!==this.current),old=this.current;
      next.pause();if(next._frameRequest&&next.cancelVideoFrameCallback)next.cancelVideoFrameCallback(next._frameRequest);next._frameRequest=null;next.classList.remove('is-visible');next.dataset.state=state;
      const placement=window.XIAOYU_PLACEMENTS?.[state]||{scale:1,x:0,y:0};
      next.style.transform=`translate3d(${placement.x}%,${placement.y}%,0) scale(${placement.scale})`;
      next.style.transformOrigin='center bottom';next.dataset.asset=placement.assetId||'';
      next.loop=['idle','listening','speaking'].includes(state);next.muted=true;next.src=`./assets/xiaoyu/webm/${state}.webm`;
      const present=()=>{
        if(token!==this.revision)return;if(!this.active){next.pause();return;}
        old?.classList.remove('is-visible');old?.pause();this.current=next;next.classList.add('is-visible');this.onReady();document.dispatchEvent(new CustomEvent('site:video-state',{detail:{state}}));
        if(this.isReduced())next.pause();
      };
      const firstFrame=()=>{if(token!==this.revision)return;if(next.requestVideoFrameCallback)next._frameRequest=next.requestVideoFrameCallback(present);else requestAnimationFrame(present);};
      next.onloadeddata=()=>{if(token!==this.revision||!this.active)return;next.play().then(firstFrame).catch(()=>{if(next.readyState>=2)present();});};
      next.onerror=()=>{if(token===this.revision){next.pause();this.onError();}};
      next.onended=()=>{if(token===this.revision&&!['sleep','idle'].includes(state))this.show('idle');};
      next.load();
    }
  };
})();
