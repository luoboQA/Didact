/*
分清有-5-种名称

真实-html-树
Didact 元素 {type, props}
虚拟-Dom-树
- 虚拟-dom-元素 { dom, element, childInstance }
- 虚拟-组件-元素 { dom, element, childInstance, publicInstance }

你写的 JSX
    ↓
Didact.createElement 编译
    ↓
Didact 元素 { type, props }  ← 这就是虚拟 DOM 树
    ↓
render 函数
    ↓
真实 HTML 树（浏览器 DOM）

Didact 元素是	树中的每一个节点 { type, props }
虚拟 DOM 树是	整个树形结构（所有节点组合起来）
1️⃣ 真实 HTML 树
是什么： 浏览器内存中实际的 DOM 节点树
<div id="root">
  <div>
    <ul>
      <li>...</li>
    </ul>
  </div>
</div>
2️⃣ Didact 元素 { type, props },appElement 就是这个！JSX 编译后就是这个对象
是什么： 描述 UI 的普通 JavaScript 对象，由 createElement 返回
{
  type: "div",
  props: {
    children: [
      { type: "ul", props: { children: [...] } }
    ]
  }
}
3️⃣ 虚拟 DOM 树
是什么： Didact 元素组成的树形结构。其实 Didact 元素本身就是虚拟 DOM！
appElement 及其递归的 children 就是虚拟 DOM 树
appElement = {
  type: "div",
  props: {
    children: [
      {
        type: "ul",
        props: {
          children: [li1, li2, li3, li4, li5]  // 5 个 li 元素
        }
      }
    ]
  }
}
4️⃣ 虚拟 DOM 元素 { dom, element, childInstance }
是什么： 这是 Didact 内部增强版的虚拟 DOM 节点，除了 element（Didact 元素）外，还缓存了：
dom：对应的真实 DOM 节点
childInstance：子节点的实例
用于后续的 reconciliation（协调/ Diff 算法），比较新旧变化
const instance = {
  dom: <真实DOM节点>,
  element: <Didact元素 { type, props }>,
  childInstances: [子实例1, 子实例2, ...]
};
5️⃣ 虚拟组件元素 { dom, element, childInstance, publicInstance }
是什么： 这是 组件级别的虚拟 DOM 节点，比上一种多了 publicInstance
// 函数组件
function StoryItem({ name, url }) {
  return <li>...</li>;
}

// 对应的虚拟组件元素
const componentInstance = {
  dom: null,  // 组件本身没有 DOM，它的 render 结果才有
  element: { type: StoryItem, props: {...} },
  childInstance: <子实例>,
  publicInstance: <StoryItem 实例>  // 存储 state 等
};
*/
/** @jsx createElement */
const rootDom = document.getElementById("root");

function tick() {
  const time = new Date().toLocaleTimeString();
  const clockElement = <h1>{time}</h1>;
  render(clockElement, rootDom);
}

tick();
setInterval(tick, 1000);

/** ⬇️⬇️⬇️⬇️⬇️ 🌼Didact🌼 ⬇️⬇️⬇️⬇️⬇️ **/

function createElement(type, config, ...args) {
  const props = Object.assign({}, config);
  const hasChildren = args.length > 0;
  const rawChildren = hasChildren ? [].concat(...args) : [];
  props.children = rawChildren
    .filter(c => c != null && c !== false)
    .map(c => c instanceof Object ? c : createTextElement(c));
  return { type, props };
}

function createTextElement(value) {
  return createElement("TEXT ELEMENT", { nodeValue: value });
}

function render(element, parentDom) {
  const { type, props } = element;

  // Create DOM element
  const isTextElement = type === "TEXT ELEMENT";
  const dom = isTextElement
    ? document.createTextNode("")
    : document.createElement(type);

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

  
  // Append or replace dom,对于这个小例子，这个解决方案运行良好，但对于更复杂的情况，重新创建所有子节点的性能成本是不可接受的
  if (!parentDom.lastChild) { // 有没有最后孩子阿
    parentDom.appendChild(dom);     
  } else {
    // 换了你的孩子, 就是这么～～
    parentDom.replaceChild(dom, parentDom.lastChild);    
  }
}
/* 实现更新逻辑
第一次渲染：
root
 └─ div (新建)
      └─ ul (新建)
           ├─ li (新建)
           │    ├─ button (新建)
           │    └─ a (新建)
           └─ li (新建)
                ├─ button (新建)
                └─ a (新建)

数据变化后，重新渲染：
root
 └─ div (新建！)      ← 整个树都是新的
      └─ ul (新建！)
           ├─ li (新建！)
           └─ li (新建！)
*/

