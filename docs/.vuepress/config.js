module.exports = {
  
  base: '/blogs/',
  // 添加标题和描述
  title: "HZ BLOG",
  description: "学习笔记，记录生活",
  // 设置 favicon.ico 图标
  head: [
    [
      'link',{ rel: 'icon', href: '/favicon.ico' }
    ]
  ],
  theme: 'reco',
  themeConfig: {
    author: "hz",
    // 顶部导航栏
    nav: [
      { text: "首页", link: "/" },
      // { text: "CSDN", link: "" },
      // { text: "Github", link: "" },
      {
        text: "hz 的博客",
        items: [
          // { text: "掘金", link: "" },
          { text: "Github", link: "" }
        ]
      }
    ],
    logo: "/avatar.jpg",
    authorAvatar: "/avatar.jpg",
    sidebar: 'auto',//自动生成侧边栏
    sidebarDepth: 2, // 子页面侧边栏显示层级
    collapsible: true, // 子页面侧边栏可折叠
    type: 'blog',
    darkMode:true,
    // 博客配置
    blogConfig: {
      category: {
        location: 2, // 在导航栏菜单中所占的位置，默认2
        text: "android ", // 默认文案 “分类”
      },
      tag: {
        location: 4, // 在导航栏菜单中所占的位置，默认4
        text: "Tag", // 默认文案 “标签”
      },
    },
    prevText: '上一篇', // 自定义「上一篇」文案（默认「上一篇」）
    nextText: '下一篇', // 自定义「下一篇」文案（默认「下一篇」）
    // 可选：是否在首页显示上一篇/下一篇（默认false，首页不需要）
    homePrevNext: false,
  },
  // plugins: [
  //   [
  //     '@vuepress-reco/vuepress-plugin-bgm-player',
  //     {
  //       audios: [
  //         {
  //           name: 'LOSER',
  //           artist: '米津玄師',
  //           url: 'https://lv-sycdn.kuwo.cn/67b4980f6aaaaf3a7df0562a3542ca22/69256e40/resource/30106/trackmedia/M500002eodOF0mvr4e.mp3?bitrate$128&from=vip',
  //           cover: 'https://p1.music.126.net/qTSIZ27qiFvRoKj-P30BiA==/109951165895951287.jpg?param=200y200'
  //         }
  //       ] ,
  //       // 是否默认缩小
  //       autoShrink: true ,
  //       // 缩小时缩为哪种模式
  //       shrinkMode: 'float',
  //       // 悬浮窗样式
  //       floatStyle:{ bottom: '10px', 'z-index': '999999' }
  //     }
  //   ]
  // ],
  locales: {
    "/": {
      lang: "zh-CN",
    },
  },
  devServer: {
    open: false // 禁用自动打开浏览器
  },
};
