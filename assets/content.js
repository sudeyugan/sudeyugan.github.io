/* 网站文案与互动对白：在这里修改，保存后刷新主页。 */
window.HOME_CONTENT = {
  "profile": {
    "name": "苏的鱼干",
    "wechat": "",
    "email": "",
    "github": ""
  },
  "copy": {
    "header.note": "一点温柔。很多好奇心。",
    "home.welcome": "欢迎。这里是我的个人主页。",
    "home.intro": "你好，我是",
    "home.english": "soft heart. curious mind.",
    "home.dragHint": "字也有一点自己的脾气，试着拉一下。",
    "home.statement": "写代码。做东西。\n也关心那些，很小的感受。",
    "home.aboutCard": "这个人\n是什么样的？",
    "home.aboutNote": "从三个词开始",
    "home.workCard": "我做的\n小鱼。",
    "home.workNote": "一隅 · 我的 AI 伙伴",
    "home.current": "正在认真做的事",
    "home.currentTitle": "一隅 Yiyu",
    "home.currentBody": "把想法、日常与 AI 伙伴，放进同一个温暖的数字空间。",
    "about.hint": "挑一个词，换个角度认识我。",
    "about.label0": "温柔",
    "about.label1": "有趣",
    "about.label2": "会做",
    "about.detail0": "让反馈自然发生",
    "about.detail1": "把选择留给使用者",
    "about.detail2": "陪伴可以很轻盈",
    "pet.titleLead": "她叫",
    "pet.name": "小鱼",
    "pet.tagline": "让陪伴，\n从屏幕里多走出来一点。",
    "pet.context": "我做的「一隅」里，有这样一个伙伴。\n可以和她说话，也可以只是安静待在一起。",
    "pet.videoLabel": "WebM 形象",
    "pet.desktopLabel": "桌面小鱼",
    "pet.dragHint": "点头发、点身体，或按住一会儿。也可以拖动她。",
    "pet.disclaimer": "能力片段为本地场景演示，不连接真实 AI 或私人数据。",
    "pet.initialSpeech": "你好呀，我是小鱼。",
    "pet.initialDetail": "换一种形象，也可以认识同一个我。",
    "pet.initialState": "在这里，陪你待一会儿。",
    "technical.title": "可爱的背后，\n也有认真的工程。",
    "technical.body": "角色只是看得到的那一层。一隅还把 AI、工具和本地应用连接在一起。",
    "technical.note": "说明依据本地一隅源码与文档。\n这里展示实现思路，不开放真实应用工具。",
    "contact.note": "很高兴，你愿意停留一下。",
    "contact.greeting": "我们可以从一句「你好」开始。",
    "contact.pending": "联系方式还在整理。先记住「苏的鱼干」吧。",
    "contact.postcard": "从网页上的一次停留，\n到生活里的一次新相遇。",
    "contact.hello": "hello,",
    "contact.friend": "friend",
    "nav.hello": "你好",
    "nav.about": "关于我",
    "nav.xiaoyu": "小鱼",
    "nav.contact": "认识一下",
    "pet.libraryTitle": "换一个心情，认识小鱼。",
    "pet.libraryHint": "选一个动作，看看她的回应。"
  },
  "stories": {
    "gentle": {
      "eyebrow": "A SOFT HEART.",
      "title": "让细节，\n照顾一下感受。",
      "body": "有些人觉得我挺温柔的。\n我想，这也会留在我做的东西里。\n比如一个恰好的回应，一点不过分打扰的陪伴。",
      "note": "先从这些片段，慢慢认识我。",
      "link": "这件事，被我做进了小鱼里",
      "path": "M90 140C65 120 15 87 15 48 15 2 72-6 90 35c18-41 75-33 75 13 0 39-50 72-75 92Z"
    },
    "curious": {
      "eyebrow": "A CURIOUS MIND.",
      "title": "有意思的想法，\n值得试试看。",
      "body": "不一定要很宏大，才值得开始。\n一个会回应的小伙伴，一个用起来舒服的界面，\n都能让我想：如果真的把它做出来呢？",
      "note": "好奇心在线。答案可以晚一点来。",
      "link": "比如，看看这个有点特别的小伙伴",
      "path": "M90 12v136M22 80h136M42 32l96 96M42 128l96-96M55 17l70 126M23 47l134 66M23 113l134-66M55 143l70-126"
    },
    "maker": {
      "eyebrow": "IDEAS, MEET REALITY.",
      "title": "想法很轻。\n把它做出来很实在。",
      "body": "从前端界面，到本地数据，再到 AI 工具。\n我喜欢弄清楚它们怎么连接，\n也在意最后用起来，是不是真的自然。",
      "note": "技术力，放在可以亲手体验的东西里。",
      "link": "打开小鱼，看看她背后的实现",
      "path": "M52 34 12 80l40 46M128 34l40 46-40 46M106 15 74 145"
    }
  },
  "openers": [
    {
      "label": "聊技术",
      "text": "你是怎么把小鱼做出来的？\n我也想做点有意思的东西。"
    },
    {
      "label": "聊想法",
      "text": "最近有什么想做、还没来得及做的小东西？\n我想听听你的想法。"
    },
    {
      "label": "随便聊",
      "text": "你好，我路过了你的主页。\n感觉我们可能聊得来。"
    }
  ],
  "pipeline": [
    "原项目支持指针响应、角色动作与语音交互。网页保留轻量的拖动、姿态与陪伴体验。",
    "模型通过 Tool Registry 使用应用能力。Agent Runtime 编排工具调用，而不是直接访问数据库；语音和动作与交互状态相连。",
    "工具经过能力、风险和资源范围检查。日记、待办、写作等内容在本地存储，外发数据有独立边界。"
  ],
  "actions": {
    "wave": {
      "title": "打个招呼",
      "speech": "你好呀。很高兴，在这里遇见你。",
      "detail": "你也可以叫我小鱼。",
      "state": "收到一个招呼。开心。",
      "video": "greeting"
    },
    "pat": {
      "title": "摸摸头",
      "speech": "收到一点温柔。谢谢你呀。",
      "detail": "今天，也要好好照顾自己。",
      "state": "摸摸头，心情变好了一点。",
      "video": "hair"
    },
    "sleep": {
      "title": "歇一会儿",
      "speech": "那就，安静地待一会儿吧。",
      "detail": "不用一直说话，陪着也很好。",
      "state": "安静模式，陪你休息。",
      "video": "sleep"
    },
    "listen": {
      "title": "听我说",
      "speech": "我在听。你可以慢慢说。",
      "detail": "不着急，把想到的告诉我就好。",
      "state": "认真倾听中。",
      "video": "listening"
    },
    "think": {
      "title": "想一想",
      "speech": "这个想法，让我认真想一想。",
      "detail": "也许，换个角度会有新的发现。",
      "state": "好奇心正在运行。",
      "video": "looking"
    },
    "stretch": {
      "title": "伸个懒腰",
      "speech": "先伸个懒腰，给自己松一口气。",
      "detail": "屏幕这边的你，也休息一下吧。",
      "state": "给日常留一点舒展。",
      "video": "stretch"
    },
    "shy": {
      "title": "害羞一下",
      "speech": "突然被你注意到，有一点不好意思。",
      "detail": "不过，认识新朋友还是很开心。",
      "state": "一点点害羞。",
      "video": "shy"
    },
    "celebrate": {
      "title": "庆祝一下",
      "speech": "为今天的一点点进展，庆祝一下！",
      "detail": "小小的完成，也值得被看见。",
      "state": "收到一点开心。",
      "video": "celebrate"
    },
    "hair": {
      "title": "理理头发",
      "speech": "等一下，整理一下被风吹乱的头发。",
      "detail": "好啦，继续陪你待一会儿。",
      "state": "整理一下自己。",
      "video": "hair"
    }
  },
  "capabilities": [
    {
      "label": "陪你聊聊",
      "title": "先听你说，再认真回应。",
      "prompt": "今天有点累，陪我待一会儿。",
      "reply": "当然。不用急着说什么，我就在这里。",
      "steps": [
        "倾听",
        "理解上下文",
        "回应与陪伴"
      ],
      "note": "原应用支持语音与流式对话；这里用预设片段展示交互节奏。",
      "video": "speaking"
    },
    {
      "label": "日常协助",
      "title": "把一句话，接到日常里。",
      "prompt": "帮我记下：周五整理项目。",
      "reply": "已整理为一条待办提议，确认后再写入。",
      "steps": [
        "理解意图",
        "提出工具动作",
        "由你确认"
      ],
      "note": "一隅可连接待办、日历与写作；网页演示不会修改真实记录。",
      "video": "listening"
    },
    {
      "label": "有边界的 AI",
      "title": "有能力，也把选择留给你。",
      "prompt": "这次需要读取什么、做什么？",
      "reply": "先看清能力与数据范围，再决定是否继续。",
      "steps": [
        "核对能力",
        "检查资源范围",
        "确认并记录"
      ],
      "note": "原项目通过工具注册、权限检查与本地数据层限定操作边界。",
      "video": "hair"
    }
  ]
};
