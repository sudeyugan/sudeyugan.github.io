/* Original cover art and stills lead each composition; the small props are local SVG. */
(() => {
  'use strict';
  const image=(file,classes)=>`<img class="source-image ${classes}" src="./assets/collection/${file}" alt="" draggable="false" decoding="async">`;
  const star='<path d="m0-7 1.8 5.2L7 0 1.8 1.8 0 7-1.8 1.8-7 0l5.2-1.8Z"/>';
  const layouts={
    novel:`<svg class="hogwarts-window" viewBox="0 0 500 450" fill="none"><path d="M80 420V215C80 55 250 10 250 10s170 45 170 205v205ZM105 420V215C105 82 250 39 250 39s145 43 145 176v205M250 39v381M105 240h290M125 337h250"/><circle cx="250" cy="185" r="83"/><circle cx="250" cy="185" r="64" stroke-dasharray="2 9"/><path d="m159 151 74-65 104 98-64 104-114-137" stroke-dasharray="2 7"/><g class="window-stars" fill="currentColor" stroke="none"><g transform="translate(144 87)">${star}</g><g transform="translate(354 117) scale(.65)">${star}</g><g transform="translate(270 308) scale(.5)">${star}</g></g></svg>${image('hp-chamber.jpg','hp-chamber')}${image('hp-azkaban.jpg','hp-azkaban')}<span class="collection-marginalia">HOGWARTS / 期待一封来信</span>`,
    lightnovel:`<span class="second-number">2<span>/ 1</span></span><svg class="relationship-thread" viewBox="0 0 700 400" fill="none"><path d="M30 170C115 20 228 15 255 135S75 290 190 340 456 302 391 180 221 81 340 53 550 95 648 250"/><path class="thread-return" d="M46 182C156 65 196 84 255 135s-94 94-18 129 199 6 154-84"/><circle cx="255" cy="135" r="5"/><circle cx="391" cy="180" r="5"/></svg>${image('lightnovel-2.webp','second-cover')}<span class="collection-marginalia">わたし、二番目の彼女でいいから。</span><span class="reading-bookmark">SECOND<br>FAVORITE.</span>`,
    webnovel:`${image('webnovel.jpg','jianke-backdrop')}<svg class="archive-orbit" viewBox="0 0 500 500" fill="none"><circle cx="250" cy="250" r="199"/><circle cx="250" cy="250" r="174" stroke-dasharray="1 12"/><path d="M23 250h454M250 23v454M78 365 365 78M112 412l300-300"/><circle class="archive-dot" cx="250" cy="51" r="5"/><circle class="archive-dot" cx="449" cy="250" r="4"/></svg><span class="archive-caption">猫腻 / 间客</span>`,
    anime:`${image('magi-visual.jpg','magi-side')}${image('magi-logo.png','magi-logo')}<svg class="magi-ruhs" viewBox="0 0 500 400" fill="none"><g class="ruh ruh-one"><path d="M80 130q-24-35-58-23 38 0 44 31-17-15-33-8 29 7 31 22Z" fill="currentColor"/></g><g class="ruh ruh-two"><path d="M370 56q-24-35-58-23 38 0 44 31-17-15-33-8 29 7 31 22Z" fill="currentColor"/></g><g class="ruh ruh-three"><path d="M229 333q-24-35-58-23 38 0 44 31-17-15-33-8 29 7 31 22Z" fill="currentColor"/></g></svg><span class="collection-marginalia">THE LABYRINTH OF MAGIC</span>`,
    film:`<div class="film-contact-sheet"><figure>${image('film-school.jpg','')}<figcaption>01 / school days</figcaption></figure><figure>${image('film-letter.jpg','')}<figcaption>02 / a letter</figcaption></figure></div><div class="film-snow" aria-hidden="true">${Array.from({length:12},(_,i)=>`<i style="--snow-x:${(i*37+11)%100}%;--snow-delay:${-i*1.7}s;--snow-duration:${13+i%5*2}s"></i>`).join('')}</div>`,
    game:`<div class="ship-log"><figure>${image('game-ship.jpg','')}<figcaption>船舱 / SHIP</figcaption></figure><figure>${image('game-camp.jpg','')}<figcaption>营火 / CAMPFIRE</figcaption></figure><svg viewBox="0 0 500 170" fill="none"><path class="log-route" d="M35 24h118l95 90h209"/><circle cx="35" cy="24" r="4"/><circle cx="457" cy="114" r="4"/></svg></div><svg class="signal-orbit" viewBox="0 0 300 300" fill="none"><circle cx="150" cy="150" r="120"/><circle cx="150" cy="150" r="90" stroke-dasharray="1 12"/><path d="M150 15v270M15 150h270"/><g class="signal-needle"><path d="m150 150 87-80"/><circle cx="237" cy="70" r="5" fill="currentColor"/></g></svg>`
  };
  const themes={
    novel:{tags:['魔法','成长','友谊'],action:'拆开来信',after:'收好来信',prop:'letter',icon:'✦'},
    lightnovel:{tags:['第二喜欢','界限','心动'],action:'夹一枚书签',after:'取下书签',prop:'bookmark',icon:'⌑'},
    webnovel:{tags:['小人物','大世界','不肯退让'],action:'接通信号',after:'信号已接通',prop:'signal',icon:'＋'},
    anime:{tags:['迷宫','伙伴','更远的世界'],action:'放飞一只鲁赫',after:'再出发一次',prop:'ruh',icon:'✧'},
    film:{tags:['岩井俊二','雪地','借书卡'],action:'盖个章',after:'已借阅',prop:'stamp',icon:'印'},
    game:{tags:['探索','未知','好奇心'],action:'追踪信号',after:'信号已找到',prop:'probe',icon:'⌁'}
  };
  window.decorateCollection=(panel,item)=>{
    const theme=themes[item.kind];if(!theme)return;
    const layer=document.createElement('div');layer.className='collection-ornament';layer.setAttribute('aria-hidden','true');layer.innerHTML=layouts[item.kind];panel.append(layer);
    const tags=document.createElement('ul');tags.className='collection-tags';tags.setAttribute('aria-label','作品关键词');theme.tags.forEach(text=>{const li=document.createElement('li');li.textContent=text;tags.append(li);});panel.append(tags);
    const action=document.createElement('button');action.type='button';action.className='collection-action action-'+theme.prop;action.setAttribute('aria-pressed','false');action.setAttribute('aria-label',theme.action);
    const symbol=document.createElement('span');symbol.className='collection-action-symbol';symbol.setAttribute('aria-hidden','true');symbol.textContent=theme.icon;
    const label=document.createElement('span');label.textContent=theme.action;action.append(symbol,label);panel.append(action);
    if(item.kind==='novel'){
      const envelope=document.createElement('div');envelope.className='novel-envelope';envelope.setAttribute('aria-hidden','true');envelope.innerHTML='<span class="envelope-letter">致：<br>还在等入学通知的人</span><span class="envelope-back"></span><span class="envelope-flap"></span><i>H</i>';panel.append(envelope);
    }
    if(item.kind==='film'){
      const card=document.createElement('div');card.className='library-card';card.setAttribute('aria-hidden','true');card.innerHTML='<span>借 阅 卡</span><small>LOVE LETTER</small><div>书 名 <b>情书</b></div><div>借 阅 人 <i>＿＿＿＿</i></div><em>已借阅</em>';panel.append(card);
    }
    action.addEventListener('click',()=>{
      const on=action.getAttribute('aria-pressed')!=='true';action.setAttribute('aria-pressed',String(on));panel.classList.toggle('is-prop-active',on);label.textContent=on?theme.after:theme.action;action.setAttribute('aria-label',label.textContent);
      if(item.kind==='anime'){panel.style.setProperty('--ruh-turn',String((Number(panel.dataset.ruhTurn)||0)+1));panel.dataset.ruhTurn=String((Number(panel.dataset.ruhTurn)||0)+1);}
    });
  };
})();
