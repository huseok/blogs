module.exports = {
  // 添加标题和描述
  base: '/blogs/',
  title: "MY BLOG",
  description: "description of my blog",
  // 设置 favicon.ico 图标
  head: [
    [
      'link',{ rel: 'icon', href: '/public/favicon.ico' }
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
          { text: "掘金", link: "https://juejin.cn/user/233526039432445" },
          { text: "Github", link: "https://github.com/Xusssyyy" }
        ]
      }
    ],
    logo: "/avatar.jpg",
    authorAvatar: "/avatar.jpg",
    sidebar: 'auto',//自动生成侧边栏
    type: 'blog',
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
  },
  locales: {
    "/": {
      lang: "zh-CN",
    },
  },
};
