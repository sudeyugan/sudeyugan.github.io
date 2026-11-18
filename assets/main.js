(() => {
  'use strict';
  const $=(s,p=document)=>p.querySelector(s), $$=(s,p=document)=>[...p.querySelectorAll(s)],content=()=>window.HOME_CONTENT;
  let profile=content().profile,current='hello',indexOpen=false,navigation=0,selectedCapability=0,demoRun=0;
  const ids=['hello','about','xiaoyu','contact'],scenes=Object.fromEntries(ids.map(id=>[id,$(`#scene-${id}`)]));
  const viewName=id=>content().copy[`nav.${id}`];
  const store={get(){try{return localStorage.getItem('sudeyugan-motion');}catch{return null;}},set(v){try{localStorage.setItem('sudeyugan-motion',v);}catch{}}};
  const media=matchMedia('(prefers-reduced-motion:reduce)'),stored=store.get();let explicit=['full','reduced'].includes(stored),reduced=explicit?stored==='reduced':media.matches;
  function setMotion(){document.documentElement.dataset.motion=reduced?'reduced':'full';$('.motion-toggle').setAttribute('aria-pressed',String(reduced));$('.motion-toggle').setAttribute('aria-label',reduced?'开启动效':'减弱动效');$('.motion-label').textContent=reduced?'动效减弱':'动效开启';window.dispatchEvent(new Event('site:motion'));}
  setMotion();$('.motion-toggle').addEventListener('click',()=>{reduced=!reduced;explicit=true;store.set(reduced?'reduced':'full');setMotion();});media.addEventListener('change',()=>{if(!explicit){reduced=media.matches;setMotion();}});
  const water=new WaterSurface(()=>reduced),motion=new HomeMotion(()=>reduced),art=new HomeArt(()=>reduced,motion),poster=new HomePoster(()=>reduced,motion),favorites=new AboutFavorites(()=>reduced),pet=new Xiaoyu(()=>reduced,text=>$('#pet-state').textContent=text),contact=new ContactMatch(()=>reduced);
  const index=$('#site-index'),indexToggle=$('.index-toggle');
  const animate=(el,frames,options={})=>el.animate(frames,{duration:reduced?0:500,easing:'cubic-bezier(.16,1,.3,1)',...options,...(reduced?{duration:0,delay:0}:{})});
  const pager=new ScrollScenes(scenes,()=>reduced,id=>{
    if(current==='xiaoyu'&&id!=='xiaoyu'){selectCapability(selectedCapability);document.documentElement.dataset.demo='idle';}
    current=id;document.documentElement.dataset.view=id;
    $$('.scene-nav [data-nav]').forEach(link=>{if(link.dataset.nav===id)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
    document.title=`${profile.name} · ${viewName(id)}`;pet.visible(id);favorites.visible(id);contact.visible(id);
    if(location.hash!==`#${id}`)history.replaceState(null,'',`#${id}`);
  },id=>{motion.captureRects();art.settle(id);});
  function setIndex(open,returnFocus=false){
    if(indexOpen===open)return;indexOpen=open;index.hidden=!open;index.inert=!open;indexToggle.setAttribute('aria-expanded',String(open));$('.scenes').inert=open;pager.lock(open);
    if(open){pet.setLibrary(false);animate(index,[{clipPath:'inset(0 0 100% 0)'},{clipPath:'inset(0 0 0 0)'}],{duration:650});$$('a',index).forEach((el,i)=>animate(el,[{opacity:0,transform:'translateY(55px) rotate(3deg)'},{opacity:1,transform:'translateY(0) rotate(0)'}],{duration:700,delay:100+i*65,fill:'backwards'}));$('a',index).focus({preventScroll:true});}
    else if(returnFocus)indexToggle.focus();
  }
  async function navigate(id,push=true){
    if(!scenes[id])return;if(id!=='about')favorites.cancelEntry();pet.setLibrary(false);setIndex(false);const token=++navigation;
    if(push&&location.hash!==`#${id}`)history.pushState(null,'',`#${id}`);
    $('.scenes').setAttribute('aria-busy','true');
    await pager.go(id);
    if(token===navigation){$('.scenes').removeAttribute('aria-busy');scenes[id].focus({preventScroll:true});}
  }
  indexToggle.addEventListener('click',()=>setIndex(!indexOpen));
  document.addEventListener('click',event=>{const link=event.target.closest('a[href^="#"]');if(!link)return;const id=link.getAttribute('href').slice(1);if(scenes[id]){if(id==='about'&&event.isTrusted)favorites.prepareEntry();event.preventDefault();navigate(id);}});
  addEventListener('hashchange',()=>navigate(location.hash.slice(1)||'hello',false));
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&indexOpen)setIndex(false,true);
    if(indexOpen&&event.key==='Tab'){const links=[indexToggle,...$$('a',index)],at=links.indexOf(document.activeElement);if(event.shiftKey&&at===0){event.preventDefault();links.at(-1).focus();}else if(!event.shiftKey&&at===links.length-1){event.preventDefault();links[0].focus();}}
  });
  function bindTabs(tabs,select,vertical=false){tabs.forEach((button,i)=>{button.addEventListener('click',()=>select(i));button.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight'||vertical&&event.key==='ArrowDown')next=(i+1)%tabs.length;else if(event.key==='ArrowLeft'||vertical&&event.key==='ArrowUp')next=(i+tabs.length-1)%tabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else return;event.preventDefault();select(next);tabs[next].focus();});});}
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,reduced?Math.min(ms,40):ms));
  function selectCapability(at,play=false){
    demoRun++;pet.endDemo?.();selectedCapability=at;const item=content().capabilities[at],tabs=$$('.capability-tabs button');
    tabs.forEach((b,i)=>{b.setAttribute('aria-selected',String(i===at));b.tabIndex=i===at?0:-1;});$('#capability-panel').setAttribute('aria-labelledby',tabs[at].id);
    $('.capability-panel h3').textContent=item.title;$('.demo-prompt').textContent=item.prompt;$('.demo-reply').textContent=item.reply;$('.capability-note').textContent=item.note;$('.play-capability').disabled=false;
    $$('.capability-steps li').forEach((li,i)=>{li.textContent=item.steps[i];li.className='';});
    if(play)playCapability();
  }
  async function playCapability(){
    const token=++demoRun,item=content().capabilities[selectedCapability],button=$('.play-capability'),reply=$('.demo-reply'),steps=$$('.capability-steps li');
    button.disabled=true;reply.textContent='';document.documentElement.dataset.demo='listening';pet.demo?.('listening');steps.forEach(li=>li.className='');
    for(let i=0;i<steps.length;i++){
      if(token!==demoRun)return;steps[i].classList.add('is-active');await wait(480);if(token!==demoRun)return;steps[i].classList.add('is-done');
    }
    if(token!==demoRun)return;document.documentElement.dataset.demo='speaking';pet.demo?.(item.video||'speaking');
    const letters=[...item.reply];
    if(reduced)reply.textContent=item.reply;
    else for(let i=0;i<letters.length;i++){if(token!==demoRun)return;reply.textContent+=letters[i];await wait(22);}
    await wait(1000);if(token!==demoRun)return;button.disabled=false;document.documentElement.dataset.demo='idle';pet.endDemo?.();
  }
  bindTabs($$('.capability-tabs button'),at=>selectCapability(at,true));$('.play-capability').addEventListener('click',playCapability);
  $$('[data-action],[data-format]').forEach(button=>button.addEventListener('click',()=>{demoRun++;$('.play-capability').disabled=false;$('.demo-reply').textContent=content().capabilities[selectedCapability].reply;document.documentElement.dataset.demo='idle';}));
  document.addEventListener('site:pet-interaction',()=>{demoRun++;$('.play-capability').disabled=false;$('.demo-reply').textContent=content().capabilities[selectedCapability].reply;document.documentElement.dataset.demo='idle';});
  function syncContent(){profile=content().profile;selectCapability(selectedCapability);contact.updateContacts();motion.refreshName?.();document.title=`${profile.name} · ${viewName(current)}`;}
  addEventListener('site:content',syncContent);syncContent();
  function clock(){$('#local-time').textContent=new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Shanghai'}).format(new Date());}
  clock();setInterval(clock,30000);
  const initial=scenes[location.hash.slice(1)]?location.hash.slice(1):'hello';pager.go(initial,true);motion.enter(scenes[initial]);
})();
