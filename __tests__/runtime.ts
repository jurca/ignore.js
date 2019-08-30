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
    it('should batch on-mount renders of multiple new components', () => {
      class Foo extends Component {
        public static is = 'x-foo'

        public render() {
          return null
        }
      }

      class Bar extends Component {
        public static is = 'x-bar'

        public render() {
          return null
        }
      }

      runtime.setRenderer(jest.fn())
      const foo1 = new Foo() as any
      const foo2 = new Foo() as any
      const bar = new Bar() as any
      jest.spyOn(foo1, 'render')
      jest.spyOn(foo2, 'render')
      jest.spyOn(bar, 'render')
      foo1.isConnected = true
      foo2.isConnected = true
      bar.isConnected = true
      foo1.connectedCallback()
      expect(foo1.render).not.toHaveBeenCalled()
      foo2.connectedCallback()
      expect(foo2.render).not.toHaveBeenCalled()
      bar.connectedCallback()
      expect(bar.render).not.toHaveBeenCalled()
    })

    it(
      'should queue updates of nested components and update them in sequence instead of recursively, but ' +
      'invoke the callbacks as if updates were recursive',
      async () => {
        const thrownErrors: Error[] = []

        enum ComponentState {
          UNMOUNTED = 'ComponentState.UNMOUNTED',
          RENDERED = 'ComponentState.RENDERED',
          BEFORE_UPDATE = 'ComponentState.BEFORE_UPDATE',
          AFTER_UPDATE = 'ComponentState.AFTER_UPDATE',
        }

        const locks = {
          bar: ComponentState.UNMOUNTED,
          foo1: ComponentState.UNMOUNTED,
          foo2: ComponentState.UNMOUNTED,
        }

        class Foo<C extends Component> extends Component<{ foo: number }> {
          public static props = ['foo']

          private child: null | C = null
          private firstRender: boolean = true

          constructor(private lockName: 'foo1' | 'foo2', private childFactory: () => C) {
            super()
          }

          public render() {
            expect(
              [ComponentState.UNMOUNTED, ComponentState.BEFORE_UPDATE].includes(locks[this.lockName]),
            ).toBe(true)
            if (this.firstRender) {
              this.child = this.childFactory()
              this.firstRender = false
            }
            (this.child as any).foo = this.props.foo
            locks[this.lockName] = ComponentState.RENDERED
            return this.child
          }

          public beforeUpdate() {
            expect(
              [ComponentState.RENDERED, ComponentState.AFTER_UPDATE].includes(locks[this.lockName]),
            ).toBe(true)
            locks[this.lockName] = ComponentState.BEFORE_UPDATE
            return null
          }

          public afterUpdate() {
            expect(locks[this.lockName]).toBe(ComponentState.RENDERED)
            locks[this.lockName] = ComponentState.AFTER_UPDATE
            return null
          }
        }

        class Bar extends Component<{ foo: number }> {
          public static props = ['foo']

          private firstRender: boolean = true

          public render() {
            expect(locks.foo1).toBe(ComponentState.RENDERED)
            expect(locks.foo2).toBe(ComponentState.RENDERED)
            expect([ComponentState.UNMOUNTED, ComponentState.BEFORE_UPDATE].includes(locks.bar)).toBe(true)
            if (this.firstRender) {
              this.firstRender = false
            }
            locks.bar = ComponentState.RENDERED
            return null
          }

          public beforeUpdate() {
            expect(locks.foo1).toBe(ComponentState.RENDERED)
            expect(locks.foo2).toBe(ComponentState.RENDERED)
            expect([ComponentState.RENDERED, ComponentState.AFTER_UPDATE].includes(locks.bar)).toBe(true)
            locks.bar = ComponentState.BEFORE_UPDATE
            return null
          }

          public afterUpdate() {
            expect(locks.foo1).toBe(ComponentState.RENDERED)
            expect(locks.foo2).toBe(ComponentState.RENDERED)
            expect(locks.bar).toBe(ComponentState.RENDERED)
            locks.bar = ComponentState.AFTER_UPDATE
            return null
          }
        }

        runtime.setRenderer((currentComponent: any, renderedSubComponent: any) => {
          if (renderedSubComponent && !renderedSubComponent.isConnected) {
            renderedSubComponent.isConnected = true
            renderedSubComponent.connectedCallback()
          }
        })

        const bar = new Bar()
        const foo2 = new Foo('foo2', () => bar)
        const foo1 = new Foo('foo1', () => foo2) as any
        for (const component of [foo1, foo2, bar]) {
          for (const method of ['render', 'beforeUpdate', 'afterUpdate']) {
            const implementation = component[method]
            component[method] = (...args: any[]) => {
              try {
                return implementation.apply(component, args)
              } catch (error) {
                thrownErrors.push(error)
                throw error
              }
            }
            jest.spyOn(component, method as any)
          }
        }

        foo1.foo = 1
        foo1.isConnected = true
        foo1.connectedCallback()

        expect(foo1.props).toEqual({})
        await Promise.resolve()
        expect(foo1.props).toEqual({foo: 1})
        expect(thrownErrors).toEqual([])
        expect(foo1.render).toHaveBeenCalledTimes(1)
        expect(foo1.beforeUpdate).not.toHaveBeenCalled()
        expect(foo1.afterUpdate).not.toHaveBeenCalled()
        expect(foo2.render).toHaveBeenCalledTimes(1)
        expect(foo2.beforeUpdate).not.toHaveBeenCalled()
        expect(foo2.afterUpdate).not.toHaveBeenCalled()
        expect(bar.render).toHaveBeenCalledTimes(1)
        expect(bar.beforeUpdate).not.toHaveBeenCalled()
        expect(bar.afterUpdate).not.toHaveBeenCalled()

        foo1.foo = 2
        expect(foo1.props).toEqual({foo: 1})
        await Promise.resolve()
        expect(foo1.props).toEqual({foo: 2})
        expect(thrownErrors).toEqual([])
      },
    )

    afterEach(() => {
      runtime.setRenderer(null as any)
    })
  })
})
