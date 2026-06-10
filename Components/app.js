/*
// Reconciliation_Render 中的 DOM 实例
const domInstance = {
  dom: <真实 DOM>,
  element: { type, props },
  childInstances: [...]
}
组件 = 可复用的UI零件 + 自己的数据(状态) + 自己的行为(逻辑)
// 🆕 当前版本中的组件实例（多了 publicInstance）
const componentInstance = {
  dom: <真实 DOM>,
  element: { type, props },        // type 是函数/类
  childInstance: {...},            // 子实例（组件 render 返回的内容）
  publicInstance: new App(props)   // 🆕 组件实例本身
}
*/
/** @jsx Didact.createElement */
const Didact = importFromBelow();

const stories = [
  { name: "Didact introduction", url: "http://bit.ly/2pX7HNn" },
  { name: "Rendering DOM elements ", url: "http://bit.ly/2qCOejH" },
  { name: "Element creation and JSX", url: "http://bit.ly/2qGbw8S" },
  { name: "Instances and reconciliation", url: "http://bit.ly/2q4A746" },
  { name: "Components and state", url: "http://bit.ly/2rE16nh" }
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
        <button onClick={e => this.like()}>{likes}<b>❤️</b></button>
        <a href={url}>{name}</a>
      </li>
    );
  }
}

Didact.render(<App stories={stories} />, document.getElementById("root"));

/** ⬇️⬇️⬇️⬇️⬇️ 🌼Didact🌼 ⬇️⬇️⬇️⬇️⬇️ **/

function importFromBelow() {
  let rootInstance = null;
  const TEXT_ELEMENT = "TEXT_ELEMENT";

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
    return createElement(TEXT_ELEMENT, { nodeValue: value });
  }

  function render(element, container) {
    const prevInstance = rootInstance;
    const nextInstance = reconcile(container, prevInstance, element);
    rootInstance = nextInstance;
  }

  function reconcile(parentDom, instance, element) {
    if (instance == null) {
      // Create instance
      const newInstance = instantiate(element);
      parentDom.appendChild(newInstance.dom);
      return newInstance;
    } else if (element == null) {
      // Remove instance
      parentDom.removeChild(instance.dom);
      return null;
    } else if (instance.element.type !== element.type) {
      // Replace instance
      const newInstance = instantiate(element);
      parentDom.replaceChild(newInstance.dom, instance.dom);
      return newInstance;
    } else if (typeof element.type === "string") {
      // Update instance
      updateDomProperties(instance.dom, instance.element.props, element.props);
      instance.childInstances = reconcileChildren(instance, element);
      instance.element = element;
      return instance;
    } else {
      // 🆕Update composite instance
      instance.publicInstance.props = element.props; // 更新 props
      const childElement = instance.publicInstance.render(); // 重新渲染
      const oldChildInstance = instance.childInstance;
      const childInstance = reconcile(
        parentDom,
        oldChildInstance,
        childElement
      );
      instance.dom = childInstance.dom;
      instance.childInstance = childInstance;
      instance.element = element;
      return instance;
    }
  }

  function reconcileChildren(instance, element) {
    const dom = instance.dom;
    const childInstances = instance.childInstances;
    const nextChildElements = element.props.children || [];
    const newChildInstances = [];
    const count = Math.max(childInstances.length, nextChildElements.length);
    for (let i = 0; i < count; i++) {
      const childInstance = childInstances[i];
      const childElement = nextChildElements[i];
      const newChildInstance = reconcile(dom, childInstance, childElement);
      newChildInstances.push(newChildInstance);
    }
    return newChildInstances.filter(instance => instance != null);
  }

  function instantiate(element) {
    const { type, props } = element;
    const isDomElement = typeof type === "string";

    if (isDomElement) {
      // Instantiate DOM element,原有逻辑创建 DOM 元素实例
      const isTextElement = type === TEXT_ELEMENT;
      const dom = isTextElement
        ? document.createTextNode("")
        : document.createElement(type);

      updateDomProperties(dom, [], props);

      const childElements = props.children || [];
      const childInstances = childElements.map(instantiate);
      const childDoms = childInstances.map(childInstance => childInstance.dom);
      childDoms.forEach(childDom => dom.appendChild(childDom));

      const instance = { dom, element, childInstances };
      return instance;
    } else {
      // Instantiate component element,🆕 创建组件实例
      const instance = {};
      const publicInstance = createPublicInstance(element, instance);
      const childElement = publicInstance.render(); // 调用组件的 render
      const childInstance = instantiate(childElement);
      const dom = childInstance.dom;

      Object.assign(instance, { dom, element, childInstance, publicInstance });
      return instance;
    }
  }

  function updateDomProperties(dom, prevProps, nextProps) {
    const isEvent = name => name.startsWith("on");
    const isAttribute = name => !isEvent(name) && name != "children";

    // Remove event listeners
    Object.keys(prevProps).filter(isEvent).forEach(name => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });

    // Remove attributes
    Object.keys(prevProps).filter(isAttribute).forEach(name => {
      dom[name] = null;
    });

    // Set attributes
    Object.keys(nextProps).filter(isAttribute).forEach(name => {
      dom[name] = nextProps[name];
    });

    // Add event listeners
    Object.keys(nextProps).filter(isEvent).forEach(name => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
  }
  function createPublicInstance(element, internalInstance) {
    const { type, props } = element;
    const publicInstance = new type(props);  // new App(props)
    publicInstance.__internalInstance = internalInstance;  // 关联回内部实例
    return publicInstance;
  }

  class Component {
    constructor(props) {
      this.props = props;
      this.state = this.state || {};
    }

    setState(partialState) {
      this.state = Object.assign({}, this.state, partialState);
      updateInstance(this.__internalInstance); // 🆕 触发更新
    }
  }

  function updateInstance(internalInstance) {
    const parentDom = internalInstance.dom.parentNode;
    const element = internalInstance.element;
    reconcile(parentDom, internalInstance, element);
  }

  return {
    createElement,
    render,
    Component
  };
}
