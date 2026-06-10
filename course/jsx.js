const TEXT_ELEMENT = "TEXT ELEMENT"; // 类型

function render(element, parentDom) {
  const { type, props } = element;

  // Create DOM element
  const isTextElement = type === "TEXT ELEMENT"; // 文本类型判定
  const dom = isTextElement
    ? document.createTextNode("") // 如果是文本节点，创建文本节点
    : document.createElement(type); // 如果是普通元素，创建HTML元素

  // Add event listeners
  const isListener = name => name.startsWith("on");
  Object.keys(props).filter(isListener).forEach(name => {
    const eventType = name.toLowerCase().substring(2);
    dom.addEventListener(eventType, props[name]);
  });

  // Set properties
  const isAttribute = name => !isListener(name) && name != "children";
  Object.keys(props).filter(isAttribute).forEach(name => {
    dom[name] = props[name];
  });

  // Render children
  const childElements = props.children || [];
  childElements.forEach(childElement => render(childElement, dom));

  // Append to parent
  parentDom.appendChild(dom);
}

// 把 JSX 标签转换成 Didact 元素对象 { type, props }
// JSX 编译器只会把 <span /> ...这种标签编译成对象，而字符串和数字是原始值,不是对象
// JSX 编译器只负责转换标签，不负责转换原始值
// eg:
// createElement("div", { id: "container", className: "box" }, "Hello", "world");
// 执行const props = Object.assign({}, { id: "container", className: "box" });
// 结果：props = { id: "container", className: "box" }
// ...args = ("Hello", "World")
// // [].concat(...args) = [].concat("Hello", "World") = ["Hello", "World"]
// eg:
// 遍历每个子元素：
// "Hello" → 不是 Object → createTextElement("Hello")
// <span /> → 是 Object → 直接保留 Object由jsx自动包装,转换成 createElement("span", null)，返回的就是一个对象
// "World" → 不是 Object → createTextElement("World")
// 结果：[
//   { type: "TEXT ELEMENT", props: { nodeValue: "Hello" } },
//   { type: "span", props: { children: [] } },
//   { type: "TEXT ELEMENT", props: { nodeValue: "World" } }
// ]
// 返回
//{
//  type: "div",
//  props: {
//    id: "container",
//    className: "box",
//    children: [
//      { type: "TEXT ELEMENT", props: { nodeValue: "Hello" } },
//      { type: "span", props: { children: [] } }, // Object由jsx自动包装
//      { type: "TEXT ELEMENT", props: { nodeValue: "World" } }
//    ]
//  }
//}
function createElement(type, config, ...args) {
    //                   ↑      ↑        ↑
    //                 标签名   属性对象  子元素们（剩余参数）
  const props = Object.assign({}, config); // 合并属性,把 config 里的所有属性复制到一个新对象 props 中
  const hasChildren = args.length > 0;
  const rawChildren = hasChildren ? [].concat(...args) : []; // [].concat(...args) 把 args 数组展平成一个新数组
  props.children = rawChildren
    .filter(c => c != null && c !== false)
    .map(c => c instanceof Object ? c : createTextElement(c));
    // 过滤-空-值, 遍历每个子元素-是Object的值保留 -> 不是-createTextElement -> 变为 类型为TEXT_ELEMENT- Didact元素
    // Object由jsx自动包装,,转换成 createElement(, )，返回的就是一个对象
  return { type, props };
}

function createTextElement(value) {
  // 规范数据
  return createElement(TEXT_ELEMENT, { nodeValue: value });
}
