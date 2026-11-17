/* One soundtrack woven through an editable, local collection. */
(() => {
  'use strict';
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),time=n=>`${Math.floor((n||0)/60)}:${String(Math.floor((n||0)%60)).padStart(2,'0')}`;
  const kinds=['music','novel','lightnovel','webnovel','anime','film','game'];
  const words={novel:'MAGIC.',lightnovel:'SECOND.',webnovel:'倔。',film:'DEAR.',game:'EXPLORE.',anime:'MAGI.'};
  window.AboutFavorites=class {
    constructor(isReduced){
      this.isReduced=isReduced;this.scene=document.querySelector('#scene-about');this.audio=this.scene.querySelector('audio');this.active=false;this.channel='music';this.userVolume=.28;this.audio.volume=this.userVolume;this.audio.loop=true;
      this.manualPaused=false;this.blocked=false;this.playEpoch=0;this.pendingPlay=false;this.entryIntent=false;this.fadeFrame=0;
      this.status=this.scene.querySelector('.listening-status');this.soundButton=this.scene.querySelector('.sound-sculpture');this.enable=this.scene.querySelector('.sound-enable');this.seek=this.scene.querySelector('.music-seek');
      this.stage=this.scene.querySelector('.interest-stage');this.collection=this.scene.querySelector('.collection-scene');this.musicPanel=this.scene.querySelector('.channel-music');this.reading=this.scene.querySelector('.gallery-current');
      this.lyrics=new KineticLyrics(this.audio,this.scene,isReduced);this.sculpture=new SoundSculpture(this.audio,this.soundButton,isReduced);
      this.soundButton.addEventListener('click',()=>this.toggle());this.enable.addEventListener('click',()=>this.resumeManually());
      this.audio.addEventListener('play',()=>{if(!this.active&&!this.entryIntent){this.audio.pause();return;}this.update();});
      ['pause','ended'].forEach(type=>this.audio.addEventListener(type,()=>this.update()));['timeupdate','loadedmetadata','seeking'].forEach(type=>this.audio.addEventListener(type,()=>this.progress()));
      this.audio.addEventListener('error',()=>{this.update();this.status.textContent='音频暂时无法播放';});
      this.seek.addEventListener('input',()=>{this.audio.currentTime=Number(this.seek.value)/1000*this.duration();this.lyrics.sync(true);this.progress();});
      this.seek.addEventListener('keydown',e=>{let t=this.audio.currentTime;if(e.key==='ArrowRight')t+=5;else if(e.key==='ArrowLeft')t-=5;else if(e.key==='Home')t=0;else if(e.key==='End')t=this.duration();else return;e.preventDefault();this.audio.currentTime=clamp(t,0,this.duration());this.lyrics.sync(true);this.progress();});
      this.scene.querySelector('.music-volume input').addEventListener('input',e=>{this.cancelFade();this.userVolume=Number(e.target.value);this.audio.volume=this.userVolume;});
      this.scene.querySelector('.music-loop').addEventListener('click',e=>{this.audio.loop=!this.audio.loop;e.currentTarget.setAttribute('aria-pressed',String(this.audio.loop));});
      this.scene.querySelector('.lyric-prev').addEventListener('click',()=>this.lyrics.step(-1));this.scene.querySelector('.lyric-next').addEventListener('click',()=>this.lyrics.step(1));
      this.bindGallery();
      this.dialog=this.scene.querySelector('dialog');this.scene.querySelector('.favorite-dialog-close').addEventListener('click',()=>this.dialog.close());this.dialog.addEventListener('click',e=>{if(e.target===this.dialog){const r=this.dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)this.dialog.close();}});
      this.render();this.progress();this.update();addEventListener('site:content',()=>this.render());
      document.addEventListener('visibilitychange',()=>{if(document.hidden){this.playEpoch++;this.pendingPlay=false;this.entryIntent=false;this.cancelFade();this.audio.pause();this.audio.volume=this.userVolume;this.sculpture.reset();}});
    }
    // Start the same media element inside a real navigation gesture; fade in only as the scene appears.
    prepareEntry(){if(this.active||this.manualPaused)return;this.entryIntent=true;this.cancelFade();if(this.audio.paused)this.requestPlay(true);else this.audio.volume=0;}
    cancelEntry(){if(this.entryIntent&&!this.active){this.entryIntent=false;this.playEpoch++;this.pendingPlay=false;this.cancelFade();this.audio.pause();this.audio.volume=this.userVolume;}}
    visible(id){
      const entering=id==='about';if(entering===this.active)return;this.active=entering;this.entryIntent=false;this.sculpture.setActive(entering);this.updateGallery();
      if(entering){if(this.manualPaused){this.update();return;}if(!this.audio.paused)this.fadeTo(this.userVolume,450);else if(!this.pendingPlay)this.requestPlay();}
      else{this.playEpoch++;this.pendingPlay=false;this.dialog.close();if(!this.audio.paused)this.fadeTo(0,260,()=>{if(!this.active){this.audio.pause();this.audio.volume=this.userVolume;}});else{this.cancelFade();this.audio.volume=this.userVolume;}}
    }
    requestPlay(navigation=false){
      const token=++this.playEpoch;this.pendingPlay=true;this.cancelFade();this.audio.volume=navigation?0:this.userVolume;
      let result;try{result=this.audio.play();}catch(error){this.failedPlay(error,token);return;}
      Promise.resolve(result).then(()=>{if(token!==this.playEpoch)return;this.pendingPlay=false;this.blocked=false;if((!this.active&&!this.entryIntent)||document.hidden){this.audio.pause();return;}if(this.active)this.fadeTo(this.userVolume,450);this.update();},error=>this.failedPlay(error,token));
    }
    failedPlay(error,token){if(token!==this.playEpoch)return;this.pendingPlay=false;this.audio.volume=this.userVolume;this.blocked=error.name==='NotAllowedError';this.update();if(error.name!=='NotAllowedError'&&error.name!=='AbortError')this.status.textContent='未能播放，请再点一次';}
    toggle(){if(!this.active)return;if(!this.audio.paused||this.pendingPlay){this.manualPaused=true;this.blocked=false;this.playEpoch++;this.pendingPlay=false;this.cancelFade();this.audio.pause();this.audio.volume=this.userVolume;this.update();}else this.resumeManually();}
    resumeManually(){if(!this.active)return;this.manualPaused=false;this.blocked=false;this.requestPlay();}
    cancelFade(){cancelAnimationFrame(this.fadeFrame);this.fadeFrame=0;}
    fadeTo(target,duration,done){this.cancelFade();const from=this.audio.volume,start=performance.now();const run=now=>{this.fadeFrame=0;const p=clamp((now-start)/duration,0,1);this.audio.volume=clamp(from+(target-from)*(p*p*(3-2*p)),0,1);if(p<1)this.fadeFrame=requestAnimationFrame(run);else done?.();};this.fadeFrame=requestAnimationFrame(run);}
    update(){const playing=!this.audio.paused&&!this.audio.ended;this.scene.classList.toggle('is-listening',playing);this.scene.classList.toggle('needs-sound',this.blocked);this.status.textContent=playing?'配乐正在播放':this.blocked?'点击开启这页的声音':this.manualPaused?'已暂停配乐':this.audio.currentTime>0?'配乐已暂停':'进入时开启配乐';this.soundButton.setAttribute('aria-label',playing?'暂停这页的配乐':'开启这页的配乐');this.soundButton.setAttribute('aria-pressed',String(playing));this.enable.hidden=!this.blocked;this.progress();}
    duration(){return Number.isFinite(this.audio.duration)?this.audio.duration:82.4679;}
    progress(){const t=this.audio.currentTime||0,f=clamp(t/this.duration(),0,1);this.seek.value=Math.round(f*1000);this.seek.style.setProperty('--position',(f*100)+'%');this.seek.setAttribute('aria-valuetext',`${time(t)} / ${time(this.duration())}`);this.scene.querySelector('.music-elapsed').textContent=time(t);this.scene.querySelector('.music-duration').textContent=time(this.duration());}
    makeArt(item){
      const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 210 280');
      const bg=document.createElementNS(ns,'rect');bg.setAttribute('width','210');bg.setAttribute('height','280');bg.setAttribute('fill','#d2ccba');svg.append(bg);
      const title=document.createElementNS(ns,'text');title.setAttribute('x','22');title.setAttribute('y','85');title.setAttribute('fill','#3e5548');title.setAttribute('font-size','18');title.textContent=item.title;svg.append(title);return svg;
    }
    picture(item){if(!item.image)return this.makeArt(item);const img=document.createElement('img');img.src=item.image;img.alt=item.title+(item.placeholder?' · 示例素材':'');img.draggable=false;img.addEventListener('error',()=>{img.replaceWith(this.makeArt(item));},{once:true});return img;}
    render(){this.collection.replaceChildren();this.panels=new Map();(window.HOME_CONTENT.favorites||[]).forEach(item=>{
      const panel=document.createElement('article');panel.className='channel-composition';panel.dataset.kind=item.kind;panel.setAttribute('aria-label',item.label+'：'+item.title);
      const word=document.createElement('span');word.className='channel-word';word.textContent=words[item.kind]||'FAVORITES';word.setAttribute('aria-hidden','true');
      const kicker=document.createElement('span');kicker.className='channel-kicker mono';kicker.textContent=String(kinds.indexOf(item.kind)+1).padStart(2,'0')+' / '+item.label+' / CURRENT FAVORITE';
      const art=document.createElement('button');art.className='channel-visual';art.type='button';art.setAttribute('aria-label','展开'+item.title+'的短评');art.setAttribute('aria-haspopup','dialog');art.append(this.picture(item));
      const caption=document.createElement('span');caption.className='channel-expand';caption.textContent='↗';caption.setAttribute('aria-hidden','true');art.append(caption);art.addEventListener('click',()=>this.openDetails(item));
      const title=document.createElement('div');title.className='channel-title';const english=document.createElement('span');english.className='channel-english mono';english.textContent=item.caption;const h3=document.createElement('h3');h3.textContent=item.title;const badge=document.createElement('span');badge.className='channel-badge';badge.textContent=item.placeholder?'示例占位 / EXAMPLE':'目前喜欢 / CURRENT FAVORITE';title.append(english,h3,badge);
      const note=document.createElement('div');note.className='channel-note';const quote=document.createElement('i');quote.textContent='“';quote.setAttribute('aria-hidden','true');const p=document.createElement('p');p.textContent=item.note;note.append(quote,p);
      const frame=document.createElement('span');frame.className='channel-frame mono';frame.textContent=String(kinds.indexOf(item.kind)+1).padStart(2,'0')+' / '+String(kinds.length).padStart(2,'0');frame.setAttribute('aria-hidden','true');panel.append(word,kicker,art,title,note,frame);window.decorateCollection?.(panel,item);this.collection.append(panel);this.panels.set(item.kind,panel);
    });this.collection.prepend(this.musicPanel);this.musicPanel.hidden=false;this.panels.set('music',this.musicPanel);this.resizeGallery();}
    openDetails(item){const art=this.dialog.querySelector('.favorite-dialog-art');art.replaceChildren(this.picture(item));this.dialog.querySelector('.favorite-dialog-kind').textContent=item.label+' / '+item.caption;this.dialog.querySelector('h3').textContent=item.fullTitle||item.title;this.dialog.querySelector('p').textContent=item.note;this.dialog.querySelector('.favorite-dialog-badge').textContent=item.placeholder?'示例占位 · 稍后换成我的收藏':'';this.dialog.showModal();}
    bindGallery(){
      this.galleryFrame=0;
      this.stage.addEventListener('scroll',()=>{if(!this.galleryFrame)this.galleryFrame=requestAnimationFrame(()=>{this.galleryFrame=0;this.updateGallery();});},{passive:true});
      this.stage.addEventListener('keydown',e=>{
        if(e.target!==this.stage||!['Home','End'].includes(e.key))return;
        e.preventDefault();this.stage.scrollTo({top:e.key==='Home'?0:this.stage.scrollHeight,behavior:this.isReduced()?'instant':'smooth'});
      });
      this.galleryObserver=new ResizeObserver(()=>this.resizeGallery());this.galleryObserver.observe(this.stage);
      addEventListener('site:motion',()=>this.updateGallery());
    }
    resizeGallery(){
      const height=this.stage.clientHeight;if(height<10)return;
      this.stage.style.setProperty('--spread-height',height+'px');this.updateGallery();
    }
    updateGallery(){
      if(!this.panels)return;
      const height=this.stage.clientHeight,scroll=this.stage.scrollTop,center=scroll+height*.5;
      let closest='music',distance=Infinity;
      for(const [kind,panel] of this.panels){
        const delta=panel.offsetTop+panel.offsetHeight*.5-center;
        if(Math.abs(delta)<distance){distance=Math.abs(delta);closest=kind;}
        panel.classList.toggle('is-reading',this.active&&Math.abs(delta)<height*.9);
        panel.style.setProperty('--scroll-lift',this.isReduced()?'0px':clamp(delta/Math.max(1,height)*-12,-12,12)+'px');
        panel.style.setProperty('--read-opacity',this.isReduced()?'1':String(1-Math.min(.15,Math.abs(delta)/Math.max(1,height)*.1)));
      }
      this.channel=closest;this.stage.dataset.channel=closest;
      if(this.reading)this.reading.textContent=String(kinds.indexOf(closest)+1).padStart(2,'0')+' / '+String(kinds.length).padStart(2,'0')+' · '+(this.panels.get(closest)?.querySelector('.channel-kicker')?.textContent.split(' / ')[1]||'音乐');
      const music=this.musicPanel,visible=music.offsetTop<scroll+height-40&&music.offsetTop+music.offsetHeight>scroll+40;
      const active=this.active&&visible;if(active!==this.lyrics.active)this.lyrics.setActive(active);
      this.stage.classList.toggle('has-begun',scroll>45);
      this.stage.style.setProperty('--read-progress',String(scroll/Math.max(1,this.stage.scrollHeight-height)));
    }
  };
})();
