// export function vnode(type, key, props, children, text) {
//     console.log(type, key, props, children, text)
//     return {
//         type,
//         key,
//         props,
//         children,
//         text
//     }
// }
export function vnode(type, props, key, children, text) {
    return {
        type,
        key,
        props,
        children,
        text
    }
}