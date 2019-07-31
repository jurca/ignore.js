// tslint:disable max-classes-per-file

import Component from '../Component.js'
import * as runtime from '../runtime.js'

describe('runtime', () => {
    it('should not update components before a renderer has been set', () => {
        const render = jest.fn()
        class Foo extends Component {
            public static is = 'x-foo'
            public render() {
                return render()
            }
        }
        runtime.define(Foo)

        const foo = new Foo() as any
        foo.isConnected = true
        foo.connectedCallback()

        expect(render).not.toHaveBeenCalled()
    })

    describe('setRenderer', () => {
        it('should update pending components once set', () => {
            class Foo extends Component {
                public static is = 'x-foo'
                public render() {
                    return null
                }
            }
            runtime.define(Foo)

            const foo = new Foo() as any
            jest.spyOn(foo, 'render')
            foo.isConnected = true
            foo.connectedCallback()
            expect(foo.render).not.toHaveBeenCalled()

            runtime.setRenderer(jest.fn())
            expect(foo.render).toHaveBeenCalledTimes(1)
        })

        afterEach(() => {
            runtime.setRenderer(null as any)
        })
    })

    describe('define', () => {
        it('should register the component\'s element with the customElements registry', () => {
            const rand = Math.random()
            class Foo extends Component {
                public static is = `x-foo${rand}`
                public render() {
                    return null
                }
            }

            runtime.define(Foo)
            expect((customElements as any).elements[`x-foo${rand}`]).toBe(Foo)
        })
    })

    describe('update', () => {
        it('should batch on-mount renders of multiple new components', () => {})

        it('should execute simple update cycle for first-time mounted components', () => {
        })

        it('should execute the full update cycle for repeated updates of components', () => {
        })

        it('should queue updates of nested components and update them in sequence instead of recursively', () => {
        })
    })
})
