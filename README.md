# ignore.js

[![Build Status](https://travis-ci.org/jurca/ignore.js.svg?branch=master)](https://github.com/jurca/ignore.js/)
[![npm](http://img.shields.io/npm/v/@jurca/-x-ignore.svg)](https://www.npmjs.com/package/@jurca/-x-ignore)
[![License](https://img.shields.io/npm/l/@jurca/-x-ignore.svg)](https://github.com/jurca/ignore.js/blob/master/LICENSE)
![TypeScript supported](https://img.shields.io/npm/types/@jurca/-x-ignore.svg)

Web components with declarative rendering built around the
[ignore-tpl](https://github.com/jurca/ignore-tpl) high-performance DOM
renderer.

This project is built upon the
[Web Components v1](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
API and therefore requires polyfills in legacy browsers (IE).

## Installation

Install the project using npm:

```bash
npm i --save @jurca/-x-ignore @jurca/-x-ignore-tpl
```

## Usage

The project can be used in a modern browser (anything except for IE) without
transpilation or polyfills. Usage in node.js will require a DOM polyfill with
[Web Components v1](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
support.

The import paths in the following examples assume usage in a browser using the
native ES module support and having `node_modules` available at the root (`/`)
path of the website, with the `-x-ignore` and `-x-ignore-tpl` packages being
installed at the same directory level.

```javascript
import {Component, define, tpl, keyed, render} from '/node_modules/@jurca/-x-ignore/ignore-with-renderer.js'

class CounterList extends Component {
  static is = "counter-list"
  static props = ["startingvalue", "currentvalue"] // optional if empty
  static observedAttributes = [] // optional if empty
  // enables slotting of provided content into the component's UI
  static useShadowDom = true

  #timerId = null

  render() {
    const {startingValue} = this.props
    const currentValue = this.props.currentValue || startingValue
    const counterIndexes = [...new Array(currentValue + 1).keys()]
      .slice(startingValue)
      .reverse()
    return tpl`
      <slot name="header">
      <ul ref="list">
        ${counterIndexes.map(value => keyed(value)`
          <li>Counter value: ${value}</li>
        `)}
      </ul>
      <slot name="footer">
    `
  }

  connectedCallback() {
    super.connectedCallback()

    this.#timerId = setInterval(() => {
      // All this.props properties are available on the component's instance
      // directly. The properties on this.props should be treated as read-only
      // while the properties set on the component's instance are read-write
      // and modifying them triggers an update.
      this.currentValue = (this.currentValue || this.startingValue) + 1
    }, 1000)
  }

  beforeUpdate(nextProps, nextAttributes) {
    console.log("Updating counter list", nextProps, nextAttributes)
  }

  afterUpdate(previousProps, previousAttributes) {
    console.log(
      "Counter list was updated. Here are the props and attributes before " +
      "the update:",
      previousProps,
      previousAttributes,
    )
    console.log(
      "Here are the rendered counter value list nodes:",
      Array.from(this.refs.list.children),
    )
  }

  disconnectedCallback() {
    clearInterval(this.#timerId)
    super.disconnectedCallback()
  }
}

define(CounterList) // registers the counter-list element with the browser

render(document.body, tpl`
  <counter-list .startingvalue="${3}">
    <header slot="header">
      This is a slotted header
    </header>
    <footer slot="footer">
      This is a slotted footer
    </footer>
  </counter-list>
`)

/*
An alternative to the render(...) code above is shown below:
const counterList = document.createElement("counter-list")
counterList.startingvalue = 3
counterList.innerHTML = `
  <header slot="header">
    This is a slotted header
  </header>
  <footer slot="footer">
    This is a slotted footer
  </footer>
`

document.body.appendChild(counterList)
*/
```

## About this project

This project is pretty much a playground where I experimented with
[react](https://reactjs.org/)-like components implemented using the modern
native browser APIs. If you are looking for a more serious project like this
to use in your next great app/website, I would recommend you to check out
[hyper-html](https://github.com/WebReflection/hyperHTML),
[lit-html](https://github.com/Polymer/lit-html) or
[haunted](https://github.com/matthewp/haunted).
