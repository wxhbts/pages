module。exports = {
  routes: [
    {
      match: "/huya/live.flv",
      src: "/huya?url=$url"， // 使用 src 代替 destination

      // 这里的键名实际上需要配合你的框架来确定。
      // EdgeOne Pages 不支持直接的查询字符串传递，所以
      // 在这里会需要将 url 显式地写到 destination 里面。

            // 可以使用 capture 捕获查询字符串参数
      "capture": ["url"],

      "middlewares": [
        (context) => {
          // 你可以在 middleware 中修改请求
          // 但在本例中可能不需要
        }
      ]
    }
  ],
};
