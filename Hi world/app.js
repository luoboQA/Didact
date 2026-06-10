// 网页加载完成后，在 root 这个位置，放一个输入框（里面预填"Hi world"）,
// 再在旁边放一段文字"Foo"。当输入框内容改变时，弹出一个提示框。
// document.addEventListener("DOMContentLoaded", () => { ... }),("页面内容加载完毕", 执行箭头函数)
document.addEventListener("DOMContentLoaded", () => {
  // Get an element by id
  const domRoot = document.getElementById("root"); // 去网页里找到id为root的那个元素
  // Create a new element given a tag name,但还没放到页面上
  const domInput = document.createElement("input");
  // Set properties
  domInput.type = "text"; // 把这个输入框设置成文本输入框
  domInput.value = "Hi world"; // 在输入框里预先显示'Hi world'这几个字
  domInput.className = "my-class"; // 给这个输入框起一个样式名字叫my-class，在style.css里定义了这个名字的样式
  // 输入元素.添加事件监听某个行为，监听的特定行为是"内容改变",e = 事件对象（包含这次操作的详细信息）
  // 当事件触发时，浏览器会自动创建一个 Event 对象,，包含该事件的相关信息。e 就是这个对象
  // e.target = 哪个元素触发了事件（这里是输入框本身）,e.target.value = 那个元素当前的内容
  // ("事件", 箭头函数(事件对象) => 弹出(事件对象.目标元素.当前值))
  domInput.addEventListener("change", e => alert(e.target.value));
  // Create a text node,一个纯文字'Foo',占位符
  const domText = document.createTextNode("Foo");
  // Append an element,把之前造好的输入框，放到根元素（<div id="root">）里面去
  domRoot.appendChild(domInput);
  // Append a text node (same as previous)
  domRoot.appendChild(domText);
});