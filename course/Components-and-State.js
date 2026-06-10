/*
组件帮助我们解决Reconciliation_Render这些问题，并让我们：
为JSX定义我们自己的“tags”
钩住「生命周期」lifecyle事件,生命周期钩子是在组件不同阶段自动执行的函数，让你可以在特定时刻执行代码

createElement
构建所谓的-Didact元素 {type, props}, 主要用于-JSx-语法糖-转换

createTextElement
构建所谓的-文本类型-Didact元素 {type:TEXT_ELEMENT, props} 主要用于-JSx-语法糖-转换

render
渲染-html,带有html元素进场。一切的开头, 接下来对比-虚拟dom树 // -- 1

reconcile
需要虚拟dom树 没有？新建！ // -- 2
具有虚拟树后, 且再次触发 , 对比-虚拟dom树, 并加/减/替换/更新dom元素/更新组件元素 // -- 7
instantiate
新建-虚拟-dom-元素/虚拟-组件-元素 // -- 3

createPublicInstance
用于构建-组件元素的新建实例 // -- 4

updateDomProperties
dom节点中删除所有旧属性，然后添加所有`新属性 // -- 5

updateInstance
用于-this.setState- 中->触发更新虚拟-dom-树 // -- 6

reconcileChildren
更新dom元素-子元素 , 递归触发-reconcile // -- 8
*/
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
    // 条件1：没有旧实例 → 创建
    if (instance == null) {
      const newInstance = instantiate(element);
      parentDom.appendChild(newInstance.dom);
      return newInstance;
    }
    
    // 条件2：没有新元素 → 删除
    if (element == null) {
      // 🆕 生命周期：componentWillUnmount
      if (instance.publicInstance && instance.publicInstance.componentWillUnmount) {
        instance.publicInstance.componentWillUnmount();
      }
      parentDom.removeChild(instance.dom);
      return null;
    }
    
    // 条件3：类型不同 → 替换
    if (instance.element.type !== element.type) {
      // 🆕 旧组件删除生命周期
      if (instance.publicInstance && instance.publicInstance.componentWillUnmount) {
        instance.publicInstance.componentWillUnmount();
      }
      const newInstance = instantiate(element);
      parentDom.replaceChild(newInstance.dom, instance.dom);
      return newInstance;
    }
    
    // 条件4：类型相同，是 DOM 元素
    if (typeof element.type === "string") {
      updateDomProperties(instance.dom, instance.element.props, element.props);
      instance.childInstances = reconcileChildren(instance, element);
      instance.element = element;
      return instance;
    }
    
    // 条件5：类型相同，是组件 → 🆕 带生命周期的组件更新
    return updateComponent(parentDom, instance, element);
  }

  // 🆕 组件更新（带完整生命周期）
  function updateComponent(parentDom, instance, element) {
    const publicInstance = instance.publicInstance;
    const oldProps = instance.element.props;
    const newProps = element.props;
    const oldState = publicInstance.state;
    
    // 生命周期：componentWillReceiveProps
    if (publicInstance.componentWillReceiveProps) {
      publicInstance.componentWillReceiveProps(newProps);
    }
    
    // 更新 props
    publicInstance.props = newProps;
    
    // 生命周期：shouldComponentUpdate
    let shouldUpdate = true;
    if (publicInstance.shouldComponentUpdate) {
      shouldUpdate = publicInstance.shouldComponentUpdate(newProps, publicInstance.state);
    }
    
    if (!shouldUpdate) {
      instance.element = element;
      return instance;
    }
    
    // 生命周期：componentWillUpdate
    if (publicInstance.componentWillUpdate) {
      publicInstance.componentWillUpdate(newProps, publicInstance.state);
    }
    
    // 重新渲染子元素
    const childElement = publicInstance.render();
    const oldChildInstance = instance.childInstance;
    const childInstance = reconcile(parentDom, oldChildInstance, childElement);
    
    // 生命周期：componentDidUpdate
    if (publicInstance.componentDidUpdate) {
      publicInstance.componentDidUpdate(oldProps, oldState);
    }
    
    // 更新实例
    instance.dom = childInstance.dom;
    instance.childInstance = childInstance;
    instance.element = element;
    
    return instance;
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
      // Instantiate DOM element
      const isTextElement = type === TEXT_ELEMENT;
      const dom = isTextElement
        ? document.createTextNode("")
        : document.createElement(type);

      updateDomProperties(dom, [], props);

      const childElements = props.children || [];
      const childInstances = childElements.map(instantiate);
      const childDoms = childInstances.map(childInstance => childInstance.dom);
      childDoms.forEach(childDom => dom.appendChild(childDom));

      return { dom, element, childInstances };
    } else {
      // 🆕 带生命周期的组件实例化
      return instantiateComponent(element);
    }
  }

  // 🆕 实例化组件（带生命周期）
  function instantiateComponent(element) {
    const instance = {};
    const publicInstance = createPublicInstance(element, instance);
    
    // 生命周期：componentWillMount
    if (publicInstance.componentWillMount) {
      publicInstance.componentWillMount();
    }
    
    const childElement = publicInstance.render();
    const childInstance = instantiate(childElement);
    const dom = childInstance.dom;
    
    // 生命周期：componentDidMount
    if (publicInstance.componentDidMount) {
      publicInstance.componentDidMount();
    }
    
    Object.assign(instance, { dom, element, childInstance, publicInstance });
    return instance;
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
    const publicInstance = new type(props);
    publicInstance.__internalInstance = internalInstance;
    return publicInstance;
  }

  // 🆕 Component 基类（完整生命周期）
  class Component {
    constructor(props) {
      this.props = props;
      this.state = this.state || {};
    }

    setState(partialState) {
      this.state = Object.assign({}, this.state, partialState);
      updateInstance(this.__internalInstance);
    }

    // 生命周期钩子（子类可覆盖）
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
}

const Didact = importFromBelow();