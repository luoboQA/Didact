// render函数不支持的一件事是文本节点。首先，我们需要定义文本元素的外观。
// 例如，<span>Foo</span>在React中描述的元素如下所示
const reactElement = {
  type: "span",
  props: {
    children: ["Foo"] // 是孩子, 但也只是一个字符串
  }
};
/*请注意，children，只是一个字符串 ，而不是另一个元素对象。

这违背了我们如何定义Didact元素：children应该是元素的数组和所有元素应该有type和props。

如果我们遵循这些规则，我们将来会少一些if判断。

因此，Didact Text Elements将type==“TEXT ELEMENT”相等，实际文本将位于nodeValue属性中。

像这个：*/
const textElement = {
  type: "span",
  props: {
    children: [
      {
        type: "TEXT ELEMENT", // 1
        props: { nodeValue: "Foo" } // 2
      }
    ]
  }
};
/* 现在我们已经规范了文本元素的数据结构，我们需要可以呈现它, 以便与其他元素一样，而区别也就是{type: "TEXT ELEMENT"}。

我们应该使用createTextNode，而不是使用createElement。

就是这样，nodeValue将会像其他属性一样设置。*/
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

// eg:
const textElement = {
  type: "TEXT ELEMENT",
  props: {
    nodeValue: "Hello World"
  }
};
const dom = document.createTextNode("");  // 创建空文本节点
dom["nodeValue"] = "Hello World"; // 把 "Hello World" 放进去