# DOM-diff

1. js对象模拟DOM中的节点

   ```js
   // 1. 创建虚拟DOM
   import {h}from './vdom' 
   h('div', {
       id: 'wrapper',
       a: 1,
       key: 'xxx'
   }, h('sapn', {
       style: {
           color: 'red'
       }
   }, 'hello'), 'td')
   ```

   ```js
   // 2. vdom/index.js
   import h from './h'
   export {
       h
   }
   ```

   ```js
   // 3. h.js
   /**
    * @param {*} type  节点
    * @param {*} props 节点属性
    * @param  {...any} children  所有孩子
    */
   import {vnode} from './vnode'
   export default function createElement(type, props = {}, ...children) {
     // 4. 获取属性的key 然后删掉
       let key;
       if (props.key) {
           key = props.key;
           delete props.key
       }
       // 5. 将不是虚拟节点的子节点 变成虚拟节点
       children = children.map(child => {
           if (typeof child === 'string') {
               return vnode(undefined, undefined, undefined, undefined, child)
           } else {
               return child
           }
       })
       return vnode(type, props, key, children)
   }
   ```

   ```js
   // 6.vnode.js
   export function vnode(type, props, key, children, text) {
       return {
           type,
           props,
           key,
           children,
           text
       }
   }
   ```

2. 渲染虚拟DOM

   ```js
   // 1. vdom/index.js
   import{render} from './patch'
   export{h,render}
   // index.js
   render(vnode, app)
   ```

   ```js
   // 2. patch.js
   export function render(vnode, container) {
       // 通过这个方法可以将虚拟节点转化为真实节点
       let ele = createDomElementFromVnode(vnode)
       //  插入到容器
       container.appendChild(ele)
   }
   // 通过虚拟节点创建一个真实的DOM节点
   function createDomElementFromVnode(vnode) {
       let {
           type,
           key,
           props,
           children,
           text
       } = vnode
       // 传递了类型 说明是一个标签
       if (type) {
           // 建立虚拟节点和真实元素一个关系 后面可以用来更新真实DOM
           vnode.domElement = document.createElement(type)
       } else {
           // 文本
           vnode.domElement = document.createTextNode(text)
       } 
       return vnode.domElement
   }
   ```

   ```js
   // 创建完真实DOM节点 根据当前的虚拟节点的属性 更新真实的dom元素
   if (type) {
     vnode.domElement = document.createElement(type)
     updateProperties(vnode) // 1. 根据当前的虚拟节点的属性 去更新真实的DOM元素
   } else {
     vnode.domElement = document.createTextNode(text)
   }
   ```

   ```js
   // 2. 后续对象的时候 会根据老的属性和新的属性 重新更新节点
   function updateProperties(newVnode, oldProps = {}) {
       let domElement = newVnode.domElement // 真实的DOM元素
       let newProps = newVnode.props // 当前虚拟节点中的属性
       // 3. 老的里面有 新的里面没有 这个属性被移除了
       for (let oldPropName in oldProps) {
           if (!newProps[oldPropName]) {
               delete domElement[oldPropName]
           }
       }
       // 4. 如果老的里面没有 新的里面有
       for (let newPropsName in newProps) {
           domElement[newPropsName] = newProps[newPropsName]
       }
       // console.log(domElement.a)
   }
   ```

   ```js
   // 如果属性是style
   for (let newPropsName in newProps) {
     // 6. 如果当前是style属性 取出来赋值给真实的DOM元素
     if (newPropsName == 'style') {
       let styleObj = newProps.style;
       for (let s in styleObj) {
         domElement.style[s] = styleObj[s];
       }
     } else {
       domElement[newPropsName] = newProps[newPropsName]
     }
   }
   ```

   ```js
   // 1. 如果新的里面有style 老的里面也有style style有可能还不一样 老的有background新的里面咩有
   let newStyleObj = newProps.style || {}
   let oldStyleObj = oldProps.style || {}
   for (let propName in oldStyleObj) {
     if (!newStyleObj[propName]) {
       document.style[propName] = ''
     }
   }
   ```

   ```js
   // 递归调用render()渲染子节点
   vnode.domElement = document.createElement(type)
   updateProperties(vnode)
   // 1. children中放的也是一个个的虚拟节点 递归调用渲染
   children.forEach(childVnode => render(childVnode, vnode.domElement))
   ```

3. 新老节点对比

   ```js
   let oldVnode = h('div', {
       id: 'wrapper',
       a: 1,
       key: 'xxx',
       style: {
           color: 'red'
       }
   }, h('sapn', {
       style: {
           color: 'red'
       }
   }, 'hello'), 'td')
   
   render(oldVnode, app)
   
   let newVnode = h('a', {}, 'hello word')
   
   setTimeout(() => {
       patch(oldVnode, newVnode)
   }, 2000);
   ```

   ```js
   export function patch(oldVnode, newVnode) {
       // 1. 类型不同
       if (oldVnode.type !== newVnode.type) {
           return oldVnode.domElement.parentNode.replaceChild(
               createDomElementFromVnode(newVnode), // 创建新的DOM
               oldVnode.domElement // 老的DOM
           )
       }
       // 2. 类型相同 换文本
       if (oldVnode.text) {
           if (oldVnode.text == newVnode.text) return
           return oldVnode.domElement.textContent = newVnode.text
       }
   }
   ```

   ```js
   // 类型一样 并且是标签 需要根据新节点的属性 更新老节点的属性
   let domElement = newVnode.domElement = oldVnode.domElement;
   // 根据最新的虚拟节点来更新属性
   updateProperties(newVnode, oldVnode.props)
   ```

   ```js
   // 三种情况
   // 1.老的有儿子 新的有儿子
   // 2.老的有儿子 新的没儿子
   // 3.新增了儿子
   let oldChildren = oldVnode.children;
   let newChildren = newVnode.children;
   // 1.老的有儿子 新的有儿子
   // 2.老的有儿子 新的没儿子
   // 3.新增了儿子
   if (oldChildren.length > 0 && newChildren.length > 0) {
     updateChildren(domElement, oldChildren, newChildren)
   } else if (oldChildren.length > 0) {
     domElement.innerHTML = ''
   } else if (newChildren.length > 0) {
     for (let i = 0; i < newChildren.length; i++) {
       domElement.appendChild(createDomElementFromVnode(newChildren[i]))
     }
   }
   ```

   ```js
   // 两个节点对比
   function isSomeVnode(oldVnode, newVnode) {
       return oldVnode.key === newVnode.key && oldVnode.type === newVnode.type
   }
   // 创建映射表 做成一个{a:0,b:1,c:2,d:3}
   function keyMapByIndex(oldChildren) {
       let map = {}
       for (let i = 0; i < oldChildren.length; i++) {
           let current = oldChildren[i]
           if (current.key) {
               map[current.key] = i
           }
       }
       return map
   }
   // diff 最复杂的列表
   function updateChildren(parent, oldChildren, newChildren) {
      // 12. 创建映射表
       let map = keyMapByIndex(oldChildren)
       
       let oldStartIndex = 0
       let oldStartVnode = oldChildren[0]
       let oldEndIndex = oldChildren.length - 1
       let oldEndVnode = oldChildren[oldEndIndex]
   
       let newStartIndex = 0
       let newStartVnode = newChildren[0]
       let newEndIndex = newChildren.length - 1
    let newEndVnode = newChildren[newEndIndex]
   
       // 1. 判断老的孩子和新的孩子 循环的时候 谁先结束就停止循环
       while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
          // 2. 如果标签和key相同接着往下
           if (isSomeVnode(oldStartVnode, newStartVnode)) {
               // 3. 如果标签相同 调用patch方法 让他们去对比属性
               patch(oldStartVnode, newStartVnode)
               // 4. 如果他们俩相同 分别往后移一位
               oldStartVnode = oldChildren[++oldStartIndex]
               newStartVnode = newChildren[++newStartIndex]
           }
       }
   }
   ```
   
   ```js
   while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
     			// 11. 判断移动到没有
     		   if (!oldStartVnode) {
               oldStartVnode = oldChildren[++oldStartIndex]
           } else if (!oldEndVnode) {
               oldEndVnode = oldChildren[--oldEndIndex]
           } else
           // 头部一样 
        if (isSomeVnode(oldStartVnode, newStartVnode)) {
               // 如果标签相同 调用patch方法 让他们去对比属性
               patch(oldStartVnode, newStartVnode)
               // 如果他们俩相同 分别往后移一位
            oldStartVnode = oldChildren[++oldStartIndex]
               newStartVnode = newChildren[++newStartIndex]
           } else if (isSomeVnode(oldEndVnode, newEndVnode)) { 
             // 7. 尾部一样
               patch(oldEndVnode, newEndVnode)
               oldEndVnode = oldChildren[--oldEndIndex]
               newEndVnode = newChildren[--newEndIndex]
           }else {
               // 9.前面都没有走 乱序
               // 需要先到新节点 去老的中查找 看是否存在 如果存在就复用 不存在就创建插入即可
               let index = map[newStartVnode.key] // 去创建映射表
               if (index == null) {
                   // 新的队列中没有此项目 
                   parent.insertBefore(createDomElementFromVnode(newStartVnode),
                       oldStartVnode.domElement
                   )
               } else {
                   let toMoveNode = oldChildren[index]
                   patch(toMoveNode, newStartVnode)
                   parent.insertBefore(toMoveNode.domElement, oldStartVnode.domElement)
                   oldChildren[index] = undefined
               }
             	// 10. 移动位置
               newStartVnode = newChildren[++newStartIndex]
           }
   }
   // 5. 把多余节点放进去  只有小于或者等于 才说明有剩余
   if (newStartIndex <= newEndIndex) {
     for (let i = newStartIndex; i <= newEndIndex; i++) {
       // 6. parent.appendChild(createDomElementFromVnode(newChildren[i]))
       
       // 8. 判断是从头比较还是从尾部比较
       let beforeElement = newChildren[newEndIndex + 1] == null ? null : newChildren[newEndIndex + 1].domElement;
       parent.insertBefore(createDomElementFromVnode(newChildren[i]), beforeElement)
     }
   }
   // 12.判断中间的unfined 直接删除
   if (oldStartIndex <= oldEndIndex) {
     for (let i = oldStartIndex; i <= oldEndIndex; i++) {
       if (oldChildren[i]) {
         parent.removeChild(oldChildren[i].domElement)
       }
     }
   }
   ```
   

