// Fiber 是一个 JavaScript 对象，代表一个工作单元，它通过链表连接，形成可遍历、可中断的工作树,不再立即渲染，而是放入队列，等浏览器空闲时处理requestIdleCallback(performWork)
/* const fiber = {
  // 基本信息
  type: "div",           // 元素类型
  props: {...},          // 属性
  stateNode: <真实DOM>,   // 对应的真实 DOM
  
  // 链表连接
  parent: fiber,         // 父节点
  child: fiber,          // 第一个子节点
  sibling: fiber,        // 下一个兄弟节点
  
  // 工作相关
  alternate: fiber,      // 上一次提交的版本（双缓冲）
  effectTag: PLACEMENT,  // 操作类型：增/删/改
  effects: [fiber],      // 需要提交的子节点列表
  
  // 组件相关
  tag: "host",           // 类型：host/class/root
  partialState: {...}    // 待更新的 state
};

// 旧版（Stack Reconciler）
function render(element, container) {
  // 递归渲染整个树，一次性完成
  // 如果树很大（10000个节点），会连续占用主线程 1 秒
  // 用户点击、动画都会卡住
}

// 新版（Fiber Reconciler）
function workLoop(deadline) {
  while (nextUnitOfWork && deadline.timeRemaining() > 1) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    // 每次只做一个节点，检查时间，不够就暂停
  }
}把一个大任务拆成多个小任务（Fiber 节点），每做完一个小任务就检查是否还有空闲时间，没有就暂停，让浏览器先响应用户

// 递归调用栈（隐式）
function render(div) {
  render(h1);      // 调用栈：render(div) → render(h1) → 返回
  render(ul);      // 调用栈：render(div) → render(ul) → render(li1) → 返回
}

// 你的 JSX Fiber
<div>           ← Fiber A
  <h1>标题</h1>  ← Fiber B
  <ul>          ← Fiber C
    <li>1</li>  ← Fiber D
    <li>2</li>  ← Fiber E
  </ul>
</div>

// Fiber 树（链表结构）
Fiber A (div)
  ├── child: Fiber B (h1)
  │     └── sibling: Fiber C (ul)
  │           └── child: Fiber D (li)
  │                 └── sibling: Fiber E (li)
  └── parent: null
第1步：render 入队 不立即渲染，而是放入队列，等浏览器空闲

第2步：workLoop 工作循环

第3步：performUnitOfWork 遍历 Fiber

第4步：beginWork 处理不同类型的 Fiber

第5步：reconcileChildrenArray 对比子节点

第6步：completeWork 收集 Effect

第7步：commitWork 提交到 DOM

双缓冲（Alternate）

// 当前屏幕上显示的是 current 树
const currentTree = {
  type: "div",
  props: { className: "old" },
  alternate: null
};

// 在内存中构建 workInProgress 树
const workInProgress = {
  type: "div",
  props: { className: "new" },
  alternate: currentTree  // ← 指向旧版本
};

// 对比时通过 alternate 拿到旧值
if (workInProgress.alternate.props.className !== workInProgress.props.className) {
  // className 变了，需要更新
}*/
/** @jsx Didact.createElement */
const Didact = importFromBelow();

const stories = [
  { name: "Didact introduction", url: "http://bit.ly/2pX7HNn" },
  { name: "Rendering DOM elements ", url: "http://bit.ly/2qCOejH" },
  { name: "Element creation and JSX", url: "http://bit.ly/2qGbw8S" },
  { name: "Instances and reconciliation", url: "http://bit.ly/2q4A746" },
  { name: "Components and state", url: "http://bit.ly/2rE16nh" },
  { name: "Fiber: Incremental reconciliation", url: "http://bit.ly/2gaF1sS" }
];

class App extends Didact.Component {
  render() {
    return (
      <div>
        <h1>Didact Stories</h1>
        <ul>
          {this.props.stories.map(story => {
            return <Story name={story.name} url={story.url} />;
          })}
        </ul>
      </div>
    );
  }
}

class Story extends Didact.Component {
  constructor(props) {
    super(props);
    this.state = { likes: Math.ceil(Math.random() * 100) };
  }
  like() {
    this.setState({
      likes: this.state.likes + 1
    });
  }
  render() {
    const { name, url } = this.props;
    const { likes } = this.state;
    const likesElement = <span />;
    return (
      <li>
        <button onClick={e => this.like()}>
          {likes}
          <b>❤️</b>
        </button>
        <a href={url}>{name}</a>
      </li>
    );
  }
}

Didact.render(<App stories={stories} />, document.getElementById("root"));

/** ⬇️⬇️⬇️⬇️⬇️ 🌼Didact🌼 ⬇️⬇️⬇️⬇️⬇️ **/

function importFromBelow() {
  //#region element.js
  const TEXT_ELEMENT = "TEXT ELEMENT";

  function createElement(type, config, ...args) {
    const props = Object.assign({}, config);
    const hasChildren = args.length > 0;
    const rawChildren = hasChildren ? [].concat(...args) : [];
    props.children = rawChildren
      .filter(c => c != null && c !== false)
      .map(c => (c instanceof Object ? c : createTextElement(c)));
    return { type, props };
  }

  function createTextElement(value) {
    return createElement(TEXT_ELEMENT, { nodeValue: value });
  }
  //#endregion
  //#region dom-utils.js
  const isEvent = name => name.startsWith("on");
  const isAttribute = name =>
    !isEvent(name) && name != "children" && name != "style";
  const isNew = (prev, next) => key => prev[key] !== next[key];
  const isGone = (prev, next) => key => !(key in next);

  function updateDomProperties(dom, prevProps, nextProps) {
    // Remove event listeners
    Object.keys(prevProps)
      .filter(isEvent)
      .filter(key => !(key in nextProps) || isNew(prevProps, nextProps)(key))
      .forEach(name => {
        const eventType = name.toLowerCase().substring(2);
        dom.removeEventListener(eventType, prevProps[name]);
      });

    // Remove attributes
    Object.keys(prevProps)
      .filter(isAttribute)
      .filter(isGone(prevProps, nextProps))
      .forEach(name => {
        dom[name] = null;
      });

    // Set attributes
    Object.keys(nextProps)
      .filter(isAttribute)
      .filter(isNew(prevProps, nextProps))
      .forEach(name => {
        dom[name] = nextProps[name];
      });

    // Set style
    prevProps.style = prevProps.style || {};
    nextProps.style = nextProps.style || {};
    Object.keys(nextProps.style)
      .filter(isNew(prevProps.style, nextProps.style))
      .forEach(key => {
        dom.style[key] = nextProps.style[key];
      });
    Object.keys(prevProps.style)
      .filter(isGone(prevProps.style, nextProps.style))
      .forEach(key => {
        dom.style[key] = "";
      });

    // Add event listeners
    Object.keys(nextProps)
      .filter(isEvent)
      .filter(isNew(prevProps, nextProps))
      .forEach(name => {
        const eventType = name.toLowerCase().substring(2);
        dom.addEventListener(eventType, nextProps[name]);
      });
  }

  function createDomElement(fiber) {
    const isTextElement = fiber.type === TEXT_ELEMENT;
    const dom = isTextElement
      ? document.createTextNode("")
      : document.createElement(fiber.type);
    updateDomProperties(dom, [], fiber.props);
    return dom;
  }
  //#endregion
  //#region component.js
  class Component {
    constructor(props) {
      this.props = props || {};
      this.state = this.state || {};
    }

    setState(partialState) {
      scheduleUpdate(this, partialState);
    }
  }

  function createInstance(fiber) {
    const instance = new fiber.type(fiber.props);
    instance.__fiber = fiber;
    return instance;
  }
  //#endregion
  //#region reconciler.js
  // Fiber tags
  const HOST_COMPONENT = "host";
  const CLASS_COMPONENT = "class";
  const HOST_ROOT = "root";

  // Effect tags
  const PLACEMENT = 1;
  const DELETION = 2;
  const UPDATE = 3;

  const ENOUGH_TIME = 1;

  // Global state
  const updateQueue = [];
  let nextUnitOfWork = null;
  let pendingCommit = null;

  function render(elements, containerDom) {
    updateQueue.push({
      from: HOST_ROOT,
      dom: containerDom,
      newProps: { children: elements }
    });
    requestIdleCallback(performWork); // 请求空闲时执行
  }

  function scheduleUpdate(instance, partialState) {
    updateQueue.push({
      from: CLASS_COMPONENT,
      instance: instance,
      partialState: partialState
    });
    requestIdleCallback(performWork);
  }

  function performWork(deadline) {
    workLoop(deadline);
    if (nextUnitOfWork || updateQueue.length > 0) {
      requestIdleCallback(performWork);
    }
  }

  function workLoop(deadline) {
    if (!nextUnitOfWork) {
      resetNextUnitOfWork(); // 从队列取任务，创建根 Fiber
    }
    // 只要有工作单元，且还有空闲时间
    while (nextUnitOfWork) {
      nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
      //               ↑ 每次只处理一个 Fiber 节点
    }
    // 所有工作都完成了
    if (pendingCommit) {
      commitAllWork(pendingCommit); // 提交到 DOM
    }
  }

  function resetNextUnitOfWork() {
    const update = updateQueue.shift();
    if (!update) {
      return;
    }

    // Copy the setState parameter from the update payload to the corresponding fiber
    if (update.partialState) {
      update.instance.__fiber.partialState = update.partialState;
    }

    const root =
      update.from == HOST_ROOT
        ? update.dom._rootContainerFiber
        : getRoot(update.instance.__fiber);

    nextUnitOfWork = {
      tag: HOST_ROOT,
      stateNode: update.dom || root.stateNode,
      props: update.newProps || root.props,
      alternate: root
    };
  }

  function getRoot(fiber) {
    let node = fiber;
    while (node.parent) {
      node = node.parent;
    }
    return node;
  }


  /*
  遍历顺序示例：
 div
 ├─ 1. 处理 div
 ├─ 2. 进入 child → h1
 ├─ 3. 处理 h1，没有子节点
 ├─ 4. 找 sibling → ul
 ├─ 5. 处理 ul，进入 child → li1
 ├─ 6. 处理 li1，没有子节点
 ├─ 7. 找 sibling → li2
 ├─ 8. 处理 li2，没有子节点
 └─ 9. 返回父节点 ul → 返回 div → 完成
  */
  function performUnitOfWork(wipFiber) {
    // 1. 处理当前 Fiber（创建 DOM 或调用 render）
    beginWork(wipFiber);

    // 2. 有子节点？返回子节点继续
    if (wipFiber.child) {
      return wipFiber.child;
    }

    // No child, we call completeWork until we find a sibling
    let uow = wipFiber;
    while (uow) {
      completeWork(uow); // 标记 effect，收集到父节点
      if (uow.sibling) {
        // Sibling needs to beginWork
        return uow.sibling; // 有兄弟节点？返回兄弟继续
      }
      uow = uow.parent;  // 向上找父节点
    }
  }

  function beginWork(wipFiber) {
    if (wipFiber.tag == CLASS_COMPONENT) { // 组件：调用 render()
      updateClassComponent(wipFiber);
    } else {
      updateHostComponent(wipFiber);  // DOM：创建 DOM 节点
    }
  }

  function updateHostComponent(wipFiber) {
    / 1. 创建真实 DOM（如果还没有）
    if (!wipFiber.stateNode) {
      wipFiber.stateNode = createDomElement(wipFiber);
    }
    // 2. 协调子节点（创建 child Fibers）
    const newChildElements = wipFiber.props.children;
    reconcileChildrenArray(wipFiber, newChildElements);
  }

  function updateClassComponent(wipFiber) {
    let instance = wipFiber.stateNode;
    
    if (instance == null) {
      // 1. 创建组件实例
      // Call class constructor
      instance = wipFiber.stateNode = createInstance(wipFiber);
    } else if (wipFiber.props == instance.props && !wipFiber.partialState) {
      // No need to render, clone children from last time
      cloneChildFibers(wipFiber);
      return;
    }

    instance.props = wipFiber.props;
    
    // 2. 合并 state
    instance.state = Object.assign({}, instance.state, wipFiber.partialState);
    wipFiber.partialState = null;
    
    // 3. 调用 render，获取子元素
    const newChildElements = wipFiber.stateNode.render();

    // 4. 协调子节点
    reconcileChildrenArray(wipFiber, newChildElements);
  }

  function arrify(val) {
    return val == null ? [] : Array.isArray(val) ? val : [val];
  }

  function reconcileChildrenArray(wipFiber, newChildElements) {
    const elements = arrify(newChildElements);

    let index = 0;
    let oldFiber = wipFiber.alternate ? wipFiber.alternate.child : null;
    let newFiber = null;
    while (index < elements.length || oldFiber != null) {
      const prevFiber = newFiber;
      const element = index < elements.length && elements[index];
      const sameType = oldFiber && element && element.type == oldFiber.type;

      if (sameType) {
        // 类型相同：复用，标记 UPDATE
        newFiber = {
          type: oldFiber.type,
          tag: oldFiber.tag,
          stateNode: oldFiber.stateNode, // ← 复用 DOM！
          props: element.props,
          parent: wipFiber,
          alternate: oldFiber,
          partialState: oldFiber.partialState,
          effectTag: UPDATE
        };
      }

      if (element && !sameType) {
        // 类型不同：新建，标记 PLACEMENT
        newFiber = {
          type: element.type,
          tag:
            typeof element.type === "string" ? HOST_COMPONENT : CLASS_COMPONENT,
          props: element.props,
          parent: wipFiber,
          effectTag: PLACEMENT
        };
      }

      if (oldFiber && !sameType) {
        // 旧的不能复用：标记 DELETION
        oldFiber.effectTag = DELETION;
        wipFiber.effects = wipFiber.effects || [];
        wipFiber.effects.push(oldFiber);
      }

      if (oldFiber) {
        oldFiber = oldFiber.sibling;
      }

      if (index == 0) {
        wipFiber.child = newFiber;
      } else if (prevFiber && element) {
        prevFiber.sibling = newFiber;
      }

      index++;
    }
  }

  function cloneChildFibers(parentFiber) {
    const oldFiber = parentFiber.alternate;
    if (!oldFiber.child) {
      return;
    }

    let oldChild = oldFiber.child;
    let prevChild = null;
    while (oldChild) {
      const newChild = {
        type: oldChild.type,
        tag: oldChild.tag,
        stateNode: oldChild.stateNode,
        props: oldChild.props,
        partialState: oldChild.partialState,
        alternate: oldChild,
        parent: parentFiber
      };
      if (prevChild) {
        prevChild.sibling = newChild;
      } else {
        parentFiber.child = newChild;
      }
      prevChild = newChild;
      oldChild = oldChild.sibling;
    }
  }

  function completeWork(fiber) {
    // 把当前 fiber 的 effects 向上合并到父节点
    if (fiber.tag == CLASS_COMPONENT) {
      fiber.stateNode.__fiber = fiber;
    }

    if (fiber.parent) {
      const childEffects = fiber.effects || [];
      const thisEffect = fiber.effectTag != null ? [fiber] : [];
      const parentEffects = fiber.parent.effects || [];
      fiber.parent.effects = parentEffects.concat(childEffects, thisEffect);
    } else {
      // 根节点，准备提交
      pendingCommit = fiber;
    }
  }

  function commitAllWork(fiber) {
    // 找到真实的父 DOM（跳过组件）
    fiber.effects.forEach(f => {
      commitWork(f);
    });
    fiber.stateNode._rootContainerFiber = fiber;
    nextUnitOfWork = null;
    pendingCommit = null;
  }

  function commitWork(fiber) {
    if (fiber.tag == HOST_ROOT) {
      return;
    }

    let domParentFiber = fiber.parent;
    while (domParentFiber.tag == CLASS_COMPONENT) {
      domParentFiber = domParentFiber.parent;
    }
    const domParent = domParentFiber.stateNode;

    if (fiber.effectTag == PLACEMENT && fiber.tag == HOST_COMPONENT) {
      domParent.appendChild(fiber.stateNode); // 新增
    } else if (fiber.effectTag == UPDATE) {
      updateDomProperties(fiber.stateNode, fiber.alternate.props, fiber.props); // 更新
    } else if (fiber.effectTag == DELETION) {
      commitDeletion(fiber, domParent); // 删除
    }
  }

  function commitDeletion(fiber, domParent) {
    let node = fiber;
    while (true) {
      if (node.tag == CLASS_COMPONENT) {
        node = node.child;
        continue;
      }
      domParent.removeChild(node.stateNode);
      while (node != fiber && !node.sibling) {
        node = node.parent;
      }
      if (node == fiber) {
        return;
      }
      node = node.sibling;
    }
  }
  //#endregion
  return {
    createElement,
    render,
    Component
  };
}
