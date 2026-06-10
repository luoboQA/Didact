  // 实现首次渲染,智能更新（Reconciliation）,不再重建整颗树
  //每次更改都会触发完整虚拟DOM树上的对比 State是-global-的 我们需要render在更改状态后-显式调用该函数
  /*
虚拟 DOM 层                   真实 DOM 层
─────────────────────────────────────────────────

instance = {                  <div id="root">
  dom: ─────────────────────→   <div class="app">
  element: {...},                   <h1>标题</h1>
  childInstances: [...]             <button>按钮</button>
}                                 </div>
                              </div>

      ↑                              ↑
   通过 dom 指向               页面上真实显示

  // 第1层：Didact 元素（你写的 JSX 编译结果）
const element = {
  type: "div",
  props: { children: [...] }
}

// 第2层：实例（render 内部缓存，用于对比）
const instance = {
  dom: <真实 DOM 节点>,           // 对应的真实 DOM
  element: { type, props },       // 当前的 Didact 元素
  childInstances: [实例1, 实例2]  // 子实例数组
}

// 第3层：真实 DOM（浏览器渲染）
<div>实际显示的内容</div>
关键： rootInstance 全局变量保存了上一次的实例树，用于和新元素对比。

// 渲染入口
let rootInstance = null;  // ← 关键！保存上一次的实例

function render(element, container) {
  const prevInstance = rootInstance;           // 1. 拿旧的
  const nextInstance = reconcile(container, prevInstance, element); // 2. 对比
  rootInstance = nextInstance;                 // 3. 存新的
}
  首次渲染:
element → instantiate → instance { dom, element, childInstances } → 挂载到页面
                                    ↓
                            rootInstance 保存

再次渲染:
新 element + rootInstance（旧实例）→ reconcile
                                          ↓
                          type 相同？→ 更新属性和子节点 → 返回原实例
                          type 不同？→ 替换
                          element 为 null？→ 删除
  */
  const TEXT_ELEMENT = "TEXT ELEMENT";
  let rootInstance = null; // 保存上一次渲染的完整实例树

  // 渲染入口
  function render(element, container) { // container 是你要把内容渲染到哪里的"容器" 即document.getElementById("root")
    const prevInstance = rootInstance;
    const nextInstance = reconcile(container, prevInstance, element);
    rootInstance = nextInstance;
  }

  // 核心协调函数
  function reconcile(parentDom, instance, element) {
  if (instance == null) {
    // Create instance,从 Didact 元素创建实例（包含 DOM）
    const newInstance = instantiate(element);
    // 把新 DOM 添加到父容器
    parentDom.appendChild(newInstance.dom);
    return newInstance;
  } else if (element == null) { // <---- 1
    // Remove instance,从父容器移除旧 DOM
    parentDom.removeChild(instance.dom);
    return null;
    // 类型相同 → 更新（复用 DOM！）
  } else if (instance.element.type === element.type) {
    // Update instance,更新当前 DOM 的属性和事件
    updateDomProperties(instance.dom, instance.element.props, element.props);
    // 递归协调子节点
    instance.childInstances = reconcileChildren(instance, element);
    // 更新缓存的 element
    instance.element = element;
    return instance;
  } else {// 类型不同 → 替换
    // 创建新实例
    const newInstance = instantiate(element);
    // 替换旧 DOM
    parentDom.replaceChild(newInstance.dom, instance.dom);
    return newInstance;
  }
}

  // 协调子节点(按位置逐个对比)
  function reconcileChildren(instance, element) {
  const dom = instance.dom;                    // 父 DOM
  const childInstances = instance.childInstances;  // 旧的子实例数组
  const nextChildElements = element.props.children || [];  // 新的子元素数组
  const newChildInstances = [];                // 存放新的子实例
  
  // 取最大长度，确保遍历完所有（不管是新增还是删除）
  const count = Math.max(childInstances.length, nextChildElements.length);
  
  for (let i = 0; i < count; i++) {
    const childInstance = childInstances[i];   // 旧实例（可能 null）
    const childElement = nextChildElements[i]; // 新元素（可能 null）
    
    // 递归协调每个位置的子节点
    const newChildInstance = reconcile(dom, childInstance, childElement);
    newChildInstances.push(newChildInstance);
  }
  
  // 过滤掉被删除的实例（reconcile 返回 null 的那些）
  return newChildInstances.filter(instance => instance != null);
}

  // 从 Didact 元素创建实例
function instantiate(element) {
  const { type, props } = element;
  
  // 创建 DOM 节点
  const isTextElement = type === TEXT_ELEMENT;
  const dom = isTextElement
    ? document.createTextNode("")      // 文本节点
    : document.createElement(type);    // 元素节点
  
  // 设置属性和事件（首次创建，prevProps 为空）
  updateDomProperties(dom, [], props);
  
  // 递归创建子节点实例
  const childElements = props.children || [];
  //当 childElements 是空数组 [] 时，map 不会执行任何迭代，递归停止
  const childInstances = childElements.map(instantiate);// ← 这里递归
  
  // 把子节点的 DOM 添加到当前 DOM
  const childDoms = childInstances.map(childInstance => childInstance.dom);
  childDoms.forEach(childDom => dom.appendChild(childDom));
  
  // 返回实例对象（缓存 DOM、元素、子实例）
  return { dom, element, childInstances };
}

  // 更新 DOM 属性（先删旧的，再加新的）
function updateDomProperties(dom, prevProps, nextProps) {
  const isEvent = name => name.startsWith("on");
  const isAttribute = name => !isEvent(name) && name !== "children";
  

  // 移除旧的事件监听
  Object.keys(prevProps).filter(isEvent).forEach(name => {
    const eventType = name.toLowerCase().substring(2);
    dom.removeEventListener(eventType, prevProps[name]);
  });
  
  // 清除旧的属性
  Object.keys(prevProps).filter(isAttribute).forEach(name => {
    dom[name] = null;
  });
  
  
  // 设置新属性
  Object.keys(nextProps).filter(isAttribute).forEach(name => {
    dom[name] = nextProps[name];
  });
  
  // 添加新的事件监听
  Object.keys(nextProps).filter(isEvent).forEach(name => {
    const eventType = name.toLowerCase().substring(2);
    dom.addEventListener(eventType, nextProps[name]);
  });
}

// 创建元素（供 JSX 编译使用）
function createElement(type, config, ...args) {
    const props = Object.assign({}, config);
    const hasChildren = args.length > 0;
    const rawChildren = hasChildren ? [].concat(...args) : [];
    props.children = rawChildren
      .filter(c => c != null && c !== false)
      .map(c => c instanceof Object ? c : createTextElement(c));
    return { type, props };
  }

  // 创建文本元素
  function createTextElement(value) {
    return createElement(TEXT_ELEMENT, { nodeValue: value });
  }
  /* 假设有这样的 Didact 元素： 
  const element = {
  type: "div",
  props: {
    className: "container",
    children: [
      {
        type: "h1",
        props: {
          children: [
            { type: "TEXT ELEMENT", props: { nodeValue: "标题" } }
          ]
        }
      },
      {
        type: "button",
        props: {
          onClick: () => alert("点击"),
          children: [
            { type: "TEXT ELEMENT", props: { nodeValue: "点我" } }
          ]
        }
      }
    ]
  }
}
  调用 instantiate(element) 后，生成的 instance 结构如下：
  const instance = {
  // 1. dom: 对应的真实 DOM 节点
  dom: 虚拟层document.createElement("div")返回的对象 真实层即<div>...</div>,  // 真实 DOM 元素
  
  // 2. element: 原来的 Didact 元素
  element: {
    type: "div",
    props: {
      className: "container",
      children: [h1元素, button元素]
    }
  },
  
  // 3. childInstances: 子实例数组
  childInstances: [
    // 第一个子实例（对应 h1）
    {
      dom: <h1>标题</h1>,
      element: { type: "h1", props: { children: [...] } },
      childInstances: [
        // h1 的文本子实例
        {
          dom: 文本节点("标题"),
          element: { type: "TEXT ELEMENT", props: { nodeValue: "标题" } },
          childInstances: []  // 文本节点没有子节点
        }
      ]
    },
    // 第二个子实例（对应 button）
    {
      dom: <button>点我</button>,
      element: { type: "button", props: { onClick: fn, children: [...] } },
      childInstances: [
        // button 的文本子实例
        {
          dom: 文本节点("点我"),
          element: { type: "TEXT ELEMENT", props: { nodeValue: "点我" } },
          childInstances: []
        }
      ]
    }
  ]
} */