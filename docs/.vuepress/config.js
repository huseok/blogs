module.exports = {
  
  // 添加标题和描述
  base: '/blogs/',
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
      { text: "CSDN", link: "" },
      { text: "Github", link: "" },
      {
        text: "hz 的博客",
        items: [
          { text: "掘金", link: "" },
          { text: "Github", link: "" }
        ]
      }
    ],
    logo: "/avatar.jpg",
    authorAvatar: "/avatar.jpg",
    sidebar: 'auto',//自动生成侧边栏
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
  locales: {
    "/": {
      lang: "zh-CN",
    },
  },
  devServer: {
    open: false // 禁用自动打开浏览器
  },
};
