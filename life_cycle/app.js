/** @jsx Didact.createElement */

// ========== 引入 Didact 库 ==========
const Didact = (function() {
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
      const newInstance = instantiate(element);
      parentDom.appendChild(newInstance.dom);
      return newInstance;
    }
    if (element == null) {
      if (instance.publicInstance && instance.publicInstance.componentWillUnmount) {
        instance.publicInstance.componentWillUnmount();
      }
      parentDom.removeChild(instance.dom);
      return null;
    }
    if (instance.element.type !== element.type) {
      if (instance.publicInstance && instance.publicInstance.componentWillUnmount) {
        instance.publicInstance.componentWillUnmount();
      }
      const newInstance = instantiate(element);
      parentDom.replaceChild(newInstance.dom, instance.dom);
      return newInstance;
    }
    if (typeof element.type === "string") {
      updateDomProperties(instance.dom, instance.element.props, element.props);
      instance.childInstances = reconcileChildren(instance, element);
      instance.element = element;
      return instance;
    }
    return updateComponent(parentDom, instance, element);
  }

  function updateComponent(parentDom, instance, element) {
    const publicInstance = instance.publicInstance;
    const oldProps = instance.element.props;
    const newProps = element.props;
    const oldState = publicInstance.state;
    
    if (publicInstance.componentWillReceiveProps) {
      publicInstance.componentWillReceiveProps(newProps);
    }
    
    publicInstance.props = newProps;
    
    let shouldUpdate = true;
    if (publicInstance.shouldComponentUpdate) {
      shouldUpdate = publicInstance.shouldComponentUpdate(newProps, publicInstance.state);
    }
    
    if (!shouldUpdate) {
      instance.element = element;
      return instance;
    }
    
    if (publicInstance.componentWillUpdate) {
      publicInstance.componentWillUpdate(newProps, publicInstance.state);
    }
    
    const childElement = publicInstance.render();
    const oldChildInstance = instance.childInstance;
    const childInstance = reconcile(parentDom, oldChildInstance, childElement);
    
    if (publicInstance.componentDidUpdate) {
      publicInstance.componentDidUpdate(oldProps, oldState);
    }
    
    instance.dom = childInstance.dom;
    instance.childInstance = childInstance;
    instance.element = element;
    
    return instance;
  }

  function reconcileChildren(instance, element) {
    const dom = instance.dom;
    const childInstances = instance.childInstances || [];
    const nextChildElements = element.props.children || [];
    const newChildInstances = [];
    const count = Math.max(childInstances.length, nextChildElements.length);
    for (let i = 0; i < count; i++) {
      const childInstance = childInstances[i];
      const childElement = nextChildElements[i];
      const newChildInstance = reconcile(dom, childInstance, childElement);
      if (newChildInstance) {
        newChildInstances.push(newChildInstance);
      }
    }
    return newChildInstances;
  }

  function instantiate(element) {
    const { type, props } = element;
    const isDomElement = typeof type === "string";

    if (isDomElement) {
      const isTextElement = type === TEXT_ELEMENT;
      const dom = isTextElement
        ? document.createTextNode("")
        : document.createElement(type);
      updateDomProperties(dom, [], props);
      const childElements = props.children || [];
      const childInstances = childElements.map(instantiate);
      childInstances.forEach(child => dom.appendChild(child.dom));
      return { dom, element, childInstances };
    } else {
      return instantiateComponent(element);
    }
  }

  function instantiateComponent(element) {
    const instance = {};
    const publicInstance = createPublicInstance(element, instance);
    
    if (publicInstance.componentWillMount) {
      publicInstance.componentWillMount();
    }
    
    const childElement = publicInstance.render();
    const childInstance = instantiate(childElement);
    const dom = childInstance.dom;
    
    if (publicInstance.componentDidMount) {
      publicInstance.componentDidMount();
    }
    
    Object.assign(instance, { dom, element, childInstance, publicInstance });
    return instance;
  }

  function updateDomProperties(dom, prevProps, nextProps) {
    const isEvent = name => name.startsWith("on");
    const isAttribute = name => !isEvent(name) && name !== "children";

    Object.keys(prevProps).filter(isEvent).forEach(name => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });

    Object.keys(prevProps).filter(isAttribute).forEach(name => {
      dom[name] = null;
    });

    Object.keys(nextProps).filter(isAttribute).forEach(name => {
      dom[name] = nextProps[name];
    });

    Object.keys(nextProps).filter(isEvent).forEach(name => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
  }

  function createPublicInstance(element, internalInstance) {
    const { type, props } = element;
    const publicInstance = new type(props);
    publicInstance.__internalInstance = internalInstance;
    return publicInstance;
  }

  class Component {
    constructor(props) {
      this.props = props;
      this.state = this.state || {};
    }
    setState(partialState) {
      this.state = Object.assign({}, this.state, partialState);
      updateInstance(this.__internalInstance);
    }
    componentWillMount() {}
    componentDidMount() {}
    componentWillReceiveProps(nextProps) {}
    shouldComponentUpdate(nextProps, nextState) { return true; }
    componentWillUpdate(nextProps, nextState) {}
    componentDidUpdate(prevProps, prevState) {}
    componentWillUnmount() {}
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
})();

// ========== 使用示例 ==========

// 1. 定义组件
class Counter extends Didact.Component {
  constructor(props) {
    super(props);
    this.state = { count: 0 };
  }

  componentDidMount() {
    console.log("组件已挂载！");
  }

  handleClick = () => {
    this.setState({ count: this.state.count + 1 });
  }

  render() {
    return (
      <div>
        <h1>计数器: {this.state.count}</h1>
        <button onClick={this.handleClick}>点我 +1</button>
      </div>
    );
  }
}

// 2. 定义另一个组件
class App extends Didact.Component {
  render() {
    return (
      <div>
        <h2>我的 Didact 应用</h2>
        <Counter />
      </div>
    );
  }
}

// 3. 渲染到页面
Didact.render(<App />, document.getElementById("root"));