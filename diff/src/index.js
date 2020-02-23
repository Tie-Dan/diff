import {
    creteElement,
    render,
    patch
} from './vdom'

let oldValue = creteElement('div', {},
    creteElement('li', {
        style: {
            background: 'red'
        },
        key: 'A'
    }, 'A'),
    creteElement('li', {
        style: {
            background: 'yellow'
        },
        key: 'B'
    }, 'B'),
    creteElement('li', {
        style: {
            background: 'blue'
        },
        key: 'C'
    }, 'C'),
    creteElement('li', {
        style: {
            background: 'green'
        },
        key: 'D'
    }, 'D')
)

render(oldValue, app)
let newValue = creteElement('div', {},

    creteElement('li', {
        style: {
            background: 'red'
        },
        key: 'F'
    }, 'F1'),
    creteElement('li', {
        style: {
            background: 'yellow'
        },
        key: 'B'
    }, 'B1'),
    creteElement('li', {
        style: {
            background: 'red'
        },
        key: 'E'
    }, 'E1'),
    creteElement('li', {
        style: {
            background: 'blue'
        },
        key: 'C'
    }, 'C1')
    // creteElement('li', {
    //     style: {
    //         background: 'green'
    //     },
    //     key: 'D'
    // }, 'D1'),


)

setTimeout(function () {
    patch(oldValue, newValue)
}, 2000)