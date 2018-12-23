import {ComponentDeclaration} from './Component.js'

const PRIVATE = {
    broker: Symbol('broker'),
}

export function define<P extends object, E extends {[refName: string]: HTMLElement}, R>(
    componentName: string,
    declaration: ComponentDeclaration<P, E, R>,
): void {
    customElements.define(componentName, class extends HTMLElement {
        public static readonly is: string = componentName

        constructor() {
            super()

            const broker = new declaration(this)
            Object.defineProperty(this, PRIVATE.broker, {
                value: broker,
            })
            for (const property of declaration.props) {
                Object.defineProperty(this, property, {
                    configurable: false,
                    enumerable: true,
                    get() {
                        return broker.props[property]
                    },
                    set(value) {
                        const currentProps = broker.props
                        const nextProps = {
                            ...currentProps as any,
                            [property]: value,
                        }
                        const changedProps = [property]

                        if (this.isConnected && broker.shouldUpdate(nextProps, changedProps)) {
                            broker.onBeforeUpdate(nextProps, changedProps)
                            this[PRIVATE.broker].props = nextProps
                            const ui = broker.render()
                            broker.renderToDom(ui, this)
                            broker.onAfterUpdate(currentProps, changedProps)
                        } else {
                            this[PRIVATE.broker].props = nextProps
                        }
                    },
                })
            }
        }

        public connectedCallback() {
            const broker = this[PRIVATE.broker]
            const ui = broker.render()
            broker.renderToDom(ui, this)
            if (this.isConnected) {
                broker.onMount()
            }
        }

        public disconnectedCallback() {
            this[PRIVATE.broker].onUnmount()
        }

        public adoptedCallback() {} // tslint:disable-line no-empty

        public attributeChangedCallback() {} // tslint:disable-line no-empty
    })
}
