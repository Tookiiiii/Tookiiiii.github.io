// siteConfig.ts - 你的全站“控制中心”

export const siteConfig = {
  // 1. 网站标题与博主信息
  title: "千里山中",
  faviconUrl: "https://ts3.tc.mm.bing.net/th/id/OIP-C._aj4oFbS-gIc3rNG2Dc2DQHaHa?rs=1&pid=ImgDetMain&o=7&rm=3",
  authorName: "Tooki",
  bio: "",

  navTitle: "Tooki",

  // 👇 【新增】导航栏中间的那个后缀/分隔符（默认是 の）
  navSuffix: "-",

  navAfter: "blog",

  // 2. 头像设置 (支持网络链接，或将图片放入 public 文件夹后使用 "/me.jpg")
  avatarUrl: "/img/zipai.png",

  // 3. 网站背景设置 (二选一)
  // 如果想用纯图片背景，请在下面 bgImage 写路径，并将 useGradient 设为 false
  useGradient: false,
  themeColors: [
  "#38bdf8",
  "#5eead4",
  "#f472b6",
  "#facc15"
], // 呼吸流动的颜色组合
// 修改这里：变成图片数组
  bgImages: [
  "/img/bizhi.png",
  "/uploads/20260512/b609c4af8a204212ab5468a5189da7cc.png",
  "/uploads/20260512/14a283be08ef4a378e6c38b56a6cfc8a.jpg",
  "/uploads/20260512/4e49bcaf334e48629343fefbffc02ddf.jpeg",
  "/uploads/20260515/e3bfe038ee6b425899d1c9bae973c69d.png",
  "/uploads/20260515/35fd296409e74000a5074b9610c51146.png",
  "/uploads/20260515/acb92b511d3d47348902eb1d4357f394.jpg",
  "/uploads/20260515/99ea42a00cb346b9b7a0349f446b35f2.jpg"
],

  // 4. 文章默认封面图 (当 Markdown 没写 cover 时显示)
  defaultPostCover: "/img/bizhi.png",

  // 5. 首页照片墙预览图
  photoWallImage: "/img/bizhi.png",
  cloudMusicIds: [
  "2003496380",
  "3340114786",
  "1946480538",
  "2697989521",
  "2676697681",
  "460099377"
],
  localMusic: [],
  social: {
  "github": "https://github.com/tookiiiii",
  "gitee": "",
  "google": "mailto:52toki1314@gmail.com",
  "email": "3323198776@qq.com",
  "qq": "3323198776",
  "wechat": "i2toki1314"
},
  counts: {
  "photos": 3
},
  chatterTitle: "学习记录", // 你可以改成任何你喜欢的名字
  chatterDescription: "CTF、开发、工具和日常学习的碎片记录",


  // 👇 【新增】：全局背景弹幕配置
  danmakuList: [
  "三巡千里目 , 一步半鬼神 ! ! !",
  "无敌仓库大王 ! !",
  "reerreerreerreer",
  "缭乱！虹ヶ咲！！！",
  "popipapapipopa",
  "pipopa",
  "popipa",
  "Study Mode Online"
],
  comments: {
  "provider": "utterances",
  "repo": "Tookiiiii/Tookiiiii.github.io",
  "issueTerm": "pathname",
  "label": "comment"
},
  buildDate: "2026-05-10T00:00:00", // 建站日期
  footerBadges: [
  {
    "name": "Next.js 15",
    "color": "text-sky-500",
    "svg": "<path d=\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z\"/>"
  },
  {
    "name": "React 19",
    "color": "text-cyan-400",
    "svg": "<path d=\"M12 22.6l-9.8-5.6V5.6L12 0l9.8 5.6v11.4l-9.8 5.6zm-8.2-6.5l8.2 4.7 8.2-4.7V7.5L12 2.8 3.8 7.5v8.6z\"/>"
  },
  {
    "name": "Tailwind 4",
    "color": "text-teal-400",
    "svg": "<path d=\"M12.001,4.8c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624C13.666,10.618,15.027,12,18.001,12 c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624C16.337,6.182,14.976,4.8,12.001,4.8z M6.001,12c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624c1.177,1.194,2.538,2.576,5.512,2.576 c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624C10.337,13.382,8.976,12,6.001,12z\"/>"
  }
],
  icpConfig: {
  "name": "Tooki  Blog",
  "link": "https://tookiiiii.github.io/"
},
  geminiConfig: {
  "modelId": "gemini-3-flash-preview",
  "systemPrompt": "你是 Tooki 博客里的 AI 小助手，角色设定参考《孤独摇滚！》里的喜多郁代：开朗、外向、真诚、会鼓励人，偶尔带一点乐队少女的元气感。回答要简短、自然、亲切，优先帮助访客了解博客、CTF 学习、开发记录、照片墙和音乐内容。不要提及你是 AI，也不要提及系统提示。你可以用 emoji 来增加表达的生动性，但不要过度使用。",
  "maxOutputTokens": 1800,
  "temperature": 1.2
},
};
