export function render(vnode, container) {

    // 通过这个方法可以将虚拟节点转化为真实节点
    console.log(vnode.text)
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
        updateProper(vnode)
        children.forEach(childVnode => render(childVnode, vnode.domElement))
    } else {
        // 文本

        vnode.domElement = document.createTextNode(text)
    }
    return vnode.domElement
}

function updateProper(newVnode, oldProps = {}) {
    let domElement = newVnode.domElement // 真实的DOM元素
    let newProps = newVnode.props // 当前虚拟节点中的属性
    // 老的里面有 新的里面没有 这个属性被移除了
    for (let oldPropName in oldProps) {
        if (!newProps[oldPropName]) {
            delete domElement[oldPropName]
        }
    }
    let newStyleObj = newProps.style || {}
    let oldStyleObj = oldProps.style || {}
    // 如果老的里面没有 新的里面有
    for (let newPropsName in newProps) {
        domElement[newPropsName] = newProps[newPropsName]
    }
    for (let propName in oldStyleObj) {
        if (!newStyleObj[propName]) {
            document.style[propName] = ''
        }
    }
    // 如果属性是style
    for (let newPropsName in newProps) {
        // 如果当前是style属性 取出来赋值给真实的DOM元素
        if (newPropsName == 'style') {
            let styleObj = newProps.style;
            for (let s in styleObj) {
                domElement.style[s] = styleObj[s];
            }
        } else {
            domElement[newPropsName] = newProps[newPropsName]
        }
    }


    // console.log(domElement.a)
}
export function patch(oldVnode, newVnode) {

    // 1. 类型不同
    // 2. 类型相同
    if (oldVnode.type !== newVnode.type) {
        return oldVnode.domElement.parentNode.replaceChild(
            createDomElementFromVnode(newVnode), oldVnode.domElement)
    }

    if (oldVnode.text) {
        if (oldVnode.text == newVnode.text) return
        return oldVnode.domElement.textContent = newVnode.text
    }
    // 类型一样 并且是标签 需要根据新节点的属性 更新老节点的属性
    let domElement = newVnode.domElement = oldVnode.domElement;
    updateProper(newVnode, oldVnode.props)

    // 三种情况
    // 1.老的有儿子 新的有儿子
    // 2.老的有儿子 新的没儿子
    // 3.新增了儿子
    let oldChildren = oldVnode.children;
    let newChildren = newVnode.children;

    if (oldChildren.length > 0 && newChildren.length > 0) {
        updateChildren(domElement, oldChildren, newChildren)
    } else if (oldChildren.length > 0) {
        domElement.innerHTML = ''
    } else if (newChildren.length > 0) {
        for (let i = 0; i < newChildren.length; i++) {
            domElement.appendChild(createDomElementFromVnode(newChildren[i]))
        }
    }


}
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

function updateChildren(parent, oldChildren, newChildren) {
    let oldStartIndex = 0
    let oldStartVnode = oldChildren[0]
    let oldEndIndex = oldChildren.length - 1
    let oldEndVnode = oldChildren[oldEndIndex]

    // 创建映射表
    let map = keyMapByIndex(oldChildren)


    let newStartIndex = 0
    let newStartVnode = newChildren[0]
    let newEndIndex = newChildren.length - 1
    let newEndVnode = newChildren[newEndIndex]

    // 1. 判断老的孩子和新的孩子 循环的时候 谁先结束就停止循环
    while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {

        if (!oldStartVnode) {
            oldStartVnode = oldChildren[++oldStartIndex]
        } else if (!oldEndVnode) {
            oldEndVnode = oldChildren[--oldEndIndex]
        } else
            // 2. 如果标签和key相同接着往下
            if (isSomeVnode(oldStartVnode, newStartVnode)) {
                // 3. 如果标签相同 调用patch方法 让他们去对比属性
                patch(oldStartVnode, newStartVnode)
                // 4. 如果他们俩相同 分别往后移一位
                oldStartVnode = oldChildren[++oldStartIndex]
                newStartVnode = newChildren[++newStartIndex]
            } else if (isSomeVnode(oldEndVnode, newEndVnode)) { // 尾部一样
            patch(oldEndVnode, newEndVnode)
            oldEndVnode = oldChildren[--oldEndIndex]
            newEndVnode = newChildren[--newEndIndex]
        } else if (isSomeVnode(oldStartVnode, newEndVnode)) { // 都一样 顺序不一样 头尾一样
            patch(oldStartVnode, newEndVnode)
            parent.insertBefore(oldStartVnode.domElement, oldEndVnode.domElement.nextSiblings)
            oldStartVnode = oldChildren[++oldStartIndex]
            newEndVnode = newChildren[--newEndIndex]
        } else if (isSomeVnode(oldEndVnode, newStartVnode)) {
            patch(oldEndVnode, newStartVnode)
            parent.insertBefore(oldEndVnode.domElement, oldStartVnode.domElement)
            oldEndVnode = oldChildren[--oldEndIndex]
            newStartVnode = newChildren[++newStartIndex]
        } else {
            // 前面都没有走 乱序
            // 需要先到新节点 去老的中查找 看是否存在 如果存在就复用 不存在就创建插入即可
            let index = map[newStartVnode.key]
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
            newStartVnode = newChildren[++newStartIndex]
        }
    }
    if (newStartIndex <= newEndIndex) {
        for (let i = newStartIndex; i <= newEndIndex; i++) {
            // parent.appendChild(createDomElementFromVnode(newChildren[i]))
            let beforeElement = newChildren[newEndIndex + 1] == null ? null : newChildren[newEndIndex + 1].domElement;
            parent.insertBefore(createDomElementFromVnode(newChildren[i]), beforeElement)
        }
    }
    // 判断unfined 直接删除
    if (oldStartIndex <= oldEndIndex) {
        for (let i = oldStartIndex; i <= oldEndIndex; i++) {
            if (oldChildren[i]) {
                parent.removeChild(oldChildren[i].domElement)
            }
        }
    }
}