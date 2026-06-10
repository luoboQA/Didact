const Didact = importFromBelow();

// 故事对象数组，每个对象都有 name 和 url 属性
const stories = [
  { name: "Didact introduction", url: "http://bit.ly/2pX7HNn" },
  { name: "Rendering DOM elements ", url: "http://bit.ly/2qCOejH" },
  { name: "Element creation and JSX", url: "http://bit.ly/2qGbw8S" },
  { name: "Instances and reconciliation", url: "http://bit.ly/2q4A746" },
  { name: "Components and state", url: "http://bit.ly/2rE16nh" }
];

const appElement = {
  type: "div",
  props: {
    children: [
      {
        type: "ul",
        props: {
           // 使用 map 将 stories 数组转换为 Didact 元素数组
           /*等价于手动执行：
           const storyElements = [
         storyElement({ name: "Didact introduction", url: "http://bit.ly/2pX7HNn" }),
         storyElement({ name: "Rendering DOM elements ", url: "http://bit.ly/2qCOejH" }),
         storyElement({ name: "Element creation and JSX", url: "http://bit.ly/2qGbw8S" }),
         storyElement({ name: "Instances and reconciliation", url: "http://bit.ly/2q4A746" }),
         storyElement({ name: "Components and state", url: "http://bit.ly/2rE16nh" })];
            map 返回的结果:
            [
        {  // 第1个故事的 li 元素
        type: "li",
        props: {
            children: [
                { type: "button", props: { children: [文本节点, 文本节点] } },
                { type: "a", props: { href: "http://bit.ly/2pX7HNn", children: [文本节点] } }
                    ]
                }
            },
        {  // 第2个故事的 li 元素
        type: "li",
        props: {
            children: [
                { type: "button", props: { children: [文本节点, 文本节点] } },
                { type: "a", props: { href: "http://bit.ly/2qCOejH", children: [文本节点] } }
                    ]
        }
        },
        // ... 还有第3、4、5个
        ]*/
          children: stories.map(storyElement)
        }
      }
    ]
  }
};

// 函数接收一个故事对象，返回一个描述列表项的 Didact 元素对象
function storyElement({ name, url }) {
  const likes = Math.ceil(Math.random() * 100);
  const buttonElement = {
    type: "button",
    props: {
      children: [
        { type: "TEXT ELEMENT", props: { nodeValue: likes } },
        { type: "TEXT ELEMENT", props: { nodeValue: "❤️" } }
      ]
    }
  };
  const linkElement = {
    type: "a",
    props: {
      href: url,
      children: [{ type: "TEXT ELEMENT", props: { nodeValue: name } }] // 链接文字来自数据
    }
  };
  // 返回完整的列表项，包含按钮和链接元素
  return {
    type: "li",
    props: {
      children: [buttonElement, linkElement]
    }
  };
}

Didact.render(appElement, document.getElementById("root"));

// 定义一个函数，把这些功能打包返回
/** ⬇️⬇️⬇️⬇️⬇️ 🌼Didact🌼 ⬇️⬇️⬇️⬇️⬇️ **/

function importFromBelow() {
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

    // Append to parent
    parentDom.appendChild(dom);
  }

  return {
    render
  };
}