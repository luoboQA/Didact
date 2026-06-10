/*上次我们介绍了Didact Elements，它是一种描述我们想要呈现给-DOM-的非常详细的方式{数据结构}
在这篇文章中，我们将看到如何使用JSX来简化元素的创建,从纯对象写法到JSX写法
JSX提供了一些语法糖来创建元素。以便代替：
*/
const element = {
  type: "div",
  props: {
    id: "container",
    children: [
      { type: "input", props: { value: "foo", type: "text" } },
      {
        type: "a",
        props: {
          href: "/bar",
          children: [{ type: "TEXT ELEMENT", props: { nodeValue: "bar" } }]
        }
      },
      {
        type: "span",
        props: {
          onClick: e => alert("Hi"),
          children: [{ type: "TEXT ELEMENT", props: { nodeValue: "click me" } }]
        }
      }
    ]
  }
};
// 我们的代码可以是
// JSX 本身不是合法的 JavaScript，需要通过 Babel 等工具编译成普通的 JS 代码
const element = (
  <div id="container">
    <input value="foo" type="text" />
    <a href="/bar">bar</a>
    <span onClick={e => alert("Hi")}>click me</span>
  </div>
);
// 编译后(实际运行的 JS):
const element = createElement(
  "div",
  { id: "container" },
  createElement("input", { value: "foo", type: "text" }),
  createElement("a", { href: "/bar" }, "bar"),
  createElement("span", { onClick: e => alert("Hi") }, "click me")
);