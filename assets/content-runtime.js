/* 本地文案绑定：编辑 assets/content.js 后刷新页面。 */
(() => {
  'use strict';
  const initial=JSON.parse(JSON.stringify(window.HOME_CONTENT));
  function text(element,value){
    element.replaceChildren(...String(value??'').split('\n').flatMap((line,i)=>i?[document.createElement('br'),document.createTextNode(line)]:[document.createTextNode(line)]));
  }
  function apply(content,notify=true){
    if(!content||!content.copy||!content.profile)return;
    window.HOME_CONTENT=content;
    document.querySelectorAll('[data-copy]').forEach(element=>{
      const value=content.copy[element.dataset.copy];if(typeof value==='string')text(element,value);
    });
    const name=String(content.profile.name||'苏的鱼干');
    document.querySelectorAll('[data-name]').forEach(el=>el.textContent=name);
    document.querySelector('.contact-label').textContent='找到'+name;
    document.querySelector('.brand').setAttribute('aria-label',name+'，回到首页');
    const title=document.querySelector('.kinetic-name');
    if(title&&title.getAttribute('aria-label')!==name){
      title.setAttribute('aria-label',name);title.replaceChildren(...[...name].map(letter=>{const el=document.createElement('span');el.className='name-glyph';el.setAttribute('aria-hidden','true');el.textContent=letter;return el;}));
      const star=document.createElement('span');star.className='name-spark';star.setAttribute('aria-hidden','true');star.textContent='✳';title.append(star);
      if([...name].length!==4)title.style.fontSize=`clamp(30px,${80/[...name].length}vw,280px)`;
    }
    const lead=document.querySelector('.pet-description h2');
    lead.firstChild.textContent=content.copy['pet.titleLead']||'她叫';lead.querySelector('span').textContent=content.copy['pet.name']||'小鱼';
    const greeting=document.querySelector('.contact-heading>p');if(greeting)greeting.textContent=content.copy['contact.greeting'];
    const hello=document.querySelector('.hello-word');if(hello)hello.textContent=content.copy['contact.hello'];
    const friend=document.querySelector('.friend-word');if(friend)friend.firstChild.textContent=content.copy['contact.friend'];
    document.querySelector('.technical-sheet>p').textContent=content.copy['technical.body'];
    const contactNote=document.querySelector('.scene-contact .scene-kicker>span:last-child');contactNote.lastChild.textContent=' '+content.copy['contact.note'];
    document.querySelectorAll('.site-index>a').forEach(link=>link.children[1].textContent=(content.copy['nav.'+link.hash.slice(1)]||'')+'。');
    document.querySelectorAll('.opener-tabs button').forEach((el,i)=>el.textContent=content.openers[i]?.label||'');
    document.querySelectorAll('.capability-tabs button').forEach((el,i)=>el.textContent=content.capabilities[i]?.label||'');
    document.querySelectorAll('[data-action]').forEach(el=>{
      const label=content.actions[el.dataset.action]?.title;if(!label)return;
      const named=el.querySelector('b');if(named){named.textContent=label;return;}
      while(el.childNodes.length>1)el.lastChild.remove();el.append(document.createTextNode(label));
    });
    document.querySelector('#action-library-title').textContent=content.copy['pet.libraryTitle'];
    document.querySelector('.action-library-note').textContent=content.copy['pet.libraryHint'];
    if(notify)window.dispatchEvent(new CustomEvent('site:content',{detail:content}));
  }
  window.SiteContent={text,apply,initial,get:()=>window.HOME_CONTENT};
  apply(window.HOME_CONTENT,false);
})();
