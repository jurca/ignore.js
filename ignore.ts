import {ComponentDeclaration} from './Component'

const PRIVATE = {
    broker: Symbol('broker')
}

export function define<P, E extends {[refName: string]: HTMLElement}, R>(
    componentName: string,
    declaration: ComponentDeclaration<P, E, R>,
): void {
    customElements.define(componentName, class extends HTMLElement {
        static readonly is = componentName

        constructor() {
            super()

            const broker = new declaration()
            Object.defineProperty(this, PRIVATE.broker, broker)
            for (const property of declaration.props) {
                Object.defineProperty(this, property, {
                    enumerable: true,
                    configurable: false,
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

                        if (broker.shouldUpdate(nextProps, changedProps)) {
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

        connectedCallback() {
            if (this.isConnected) {
                this[PRIVATE.broker].onMount()
            }
        }

        disconnectedCallback() {
            this[PRIVATE.broker].onUnmount()
        }

        adoptedCallback() {} // not used

        attributeChangedCallback() {} // not used
    })
}
