import {
    vnode
} from './vnode'
export default function createElement(type, props = {}, ...children) {
    // 获取属性的key 然后删掉
    let key;
    if (props.key) { // 获取属性的key 然后删掉
        key = props.key;
        delete props.key
    }
    children = children.map(child => {
        if (typeof child === 'string') {
            return vnode(undefined, undefined, undefined, undefined, child)
        } else {
            return child
        }
        //{type: "sapn", key: undefined, props: {…}, children: Array(1), text: undefined}
        // td
    })
    return vnode(type, props, key, children)

}