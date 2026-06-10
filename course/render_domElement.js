// 基础版,接收一个元素和一个dom容器,将元素及其子元素呈现给dom,缺少属性和事件监听器
function render(element, parentDom) {
  // 第1步：解构,从 element 对象里取出 type 和 props
  const { type, props } = element;  // type="input", props={...}
  
  // 第2步：创建DOM元素
  const dom = document.createElement(type);  // <input>
  
  // 第3步：获取子元素（没有就空数组）
  const childElements = props.children || [];  // []
  
  // 第4步：渲染子元素,把所有子孙元素都创建好
  childElements.forEach(childElement => render(childElement, dom));
  
  // 第5步：挂载到父容器
  parentDom.appendChild(dom);  // <input> 被添加，但没有任何属性
}

// eg: 假设我们要渲染这样的结构：
HTML5:
goal:
<div id="root">
  <div>
    <input>
    <span></span>
  </div>
</div>
render:
<div>
  <input>
  <span></span>
</div>
先用对象描述这个结构
const element = {
  type: "div",
  props: {
    children: [
      { type: "input", props: {} },      // 第一个子元素
      { type: "span", props: {} }        // 第二个子元素
    ]
  }
};
调用 render 函数
render(element, document.getElementById("root"));
第1层：渲染 div
const dom = document.createElement("div");  // 创建 <div></div>
之后获取子元素会递归处理 input 和 span，等它们都完成后，才继续往下，appendChild(dom)

第2层：渲染 input（在 div 内部），执行完这一步后，div 内部变成了
<div>
  <input>
</div>

第3层：渲染 span（也在 div 内部），执行完这一步后，div 内部变成了
<div>
  <input>
  <span></span>
</div>
回到第1层：继续执行第5步
<div id="root">
  <div>
    <input>
    <span></span>
  </div>
</div>
// =====================================  完整版  =========================================================
function render(element, parentDom) {
  const { type, props } = element;
  const dom = document.createElement(type);
  
  //name => - 箭头函数，接收一个参数 name
  const isListener = name => name.startsWith("on");// 识别事件监听器，判断属性名是否以"on"开头

  Object.keys(props)           // 获取所有key 属性名，如 ["onChange", "value", "className"]
    .filter(isListener)        // 只保留 on 开头的，如 ["onChange"]
    .forEach(name => {         // 遍历每个事件属性
    const eventType = name.toLowerCase().substring(2); // "onChange" → "change"
    dom.addEventListener(eventType, props[name]);      // 绑定事件
  });
  // 每一个开头-on 的属性-对应-函数 props[name] - >用-dom-addEvent 接连

  // 识别普通属性,不是事件,不是特殊的 children 属性
  const isAttribute = name => !isListener(name) && name != "children";
  
  Object.keys(props)
    .filter(isAttribute)  // 只保留普通属性
    .forEach(name => {
    dom[name] = props[name];  // 直接赋值
  });
 // 处理子元素,递归渲染每个子元素
  const childElements = props.children || [];
  childElements.forEach(childElement => render(childElement, dom));

  // 添加到父容器,把创建好的完整 DOM 树挂载到页面上
  parentDom.appendChild(dom);
}

// eg:
// 如果你的元素是
const element = {
  type: "input",
  props: {
    onChange: (e) => alert(e.target.value),
    value: "Hi"
  }
};

// 最终会执行
dom.addEventListener("change", (e) => alert(e.target.value));

// 如果 props 是
{
  value: "Hi world",
  className: "my-class",
  id: "myInput"
}

// 会执行
dom["value"] = "Hi world";     // 等价于 dom.value = "Hi world"
dom["className"] = "my-class"; // 等价于 dom.className = "my-class"
dom["id"] = "myInput";         // 等价于 dom.id = "myInput"