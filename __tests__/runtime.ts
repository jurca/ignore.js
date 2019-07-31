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

        const foo = new Foo()
        foo.connectedCallback()

        expect(render).not.toHaveBeenCalled()
    })

    describe('setRenderer', () => {
        it('should update pending components once set', () => {
        })
    })

    describe('define', () => {
        it('should register the component\'s element with the customElements registry', () => {
        })
    })

    describe('update', () => {
        it('should batch on-mount renders of multiple new components', () => {})

        it('should execute simple update cycle for first-time mounted components', () => {
        })

        it('should execture the full update cycle for repeated updates of components', () => {
        })

        it('should queue updates of nested components and update them in sequence instead of recursively', () => {
        })
    })
})
