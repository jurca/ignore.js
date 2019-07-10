// https://jestjs.io/docs/en/configuration#testenvironment-string

const NodeEnvironment = require('jest-environment-node')

class ComponentTestingEnvironment extends NodeEnvironment {
    async setup() {
        await super.setup()
        this.global.Node = Node
        this.global.Element = Element
        this.global.HTMLElement = HTMLElement
        this.global.customElements = {
            elements: {},
            define(name, implementation) {
                this.elements[name] = implementation
            },
        }
    }
}

class Node {}

class Element extends Node {}

class HTMLElement extends Element {
    constructor() {
        super()

        this.shadowRootConfig = null
    }

    attachShadow(config) {
        this.shadowRootConfig = config
    }
}

module.exports = ComponentTestingEnvironment
