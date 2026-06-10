// Didact/React 的核心思想：用普通的 JavaScript 对象来描述 HTML 结构
// 对象描述 DOM，像这样的一个元素
const element = {
  type: "div", // → <div>
  props: { // props 是属性的集合
    id: "container", // → id="container"
    children: [ // → 开始装子元素
      { type: "input", props: { value: "foo", type: "text" } },
      // { 元素开始 → <input → value="foo" → type="text" → > → 元素结束
      { type: "a", props: { href: "/bar" } },
      { type: "span", props: {} }
    ]
  }
};

// 描述这个dom:
<div id="container">
  <input value="foo" type="text">
  <a href="/bar"></a>
  <span></span>
</div>