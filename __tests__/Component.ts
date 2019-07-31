// tslint:disable max-classes-per-file

import {Component, setRenderer} from '../ignore.js'

describe('Component', () => {
  it('should extend the HTMLElement class and should be usable in the DOM', () => {
    class TestingElement extends Component {
      public static is = 'testing-element'
    }

    expect(TestingElement.prototype instanceof HTMLElement).toBeTruthy()
  })

  it('should create a shadow root if the component sets the useShadowDom flag', () => {
    class FooElement extends Component {
      public static is = 'foo-element'
    }

    class BarElement extends Component {
      public static is = 'bar-element'
      public static useShadowDom = true
    }

    const foo = new FooElement() as any
    const bar = new BarElement() as any
    expect(foo.shadowRootConfig).toBeNull()
    expect(bar.shadowRootConfig).toEqual({mode: 'open'})
  })

  it('should render itself on mount without executing update callbacks', async () => {
    const render = jest.fn()
    const beforeUpdate = jest.fn()
    const afterUpdate = jest.fn()
    class FooElement extends Component {
      public static is = 'foo-element'

      public render(...args: unknown[]) {
        return render(...args)
      }

      public beforeUpdate() {
        return beforeUpdate()
      }

      public afterUpdate() {
        return afterUpdate()
      }
    }

    setRenderer(jest.fn())
    const foo = new FooElement()
    ;(foo as any).isConnected = true // tslint:disable-line align whitespace
    foo.connectedCallback()
    await Promise.resolve()
    expect(render).toHaveBeenCalledTimes(1)
    expect(render).toHaveBeenCalledWith()
    expect(beforeUpdate).not.toHaveBeenCalled()
    expect(afterUpdate).not.toHaveBeenCalled()
  })

  it('should not render itself upon mounting if the renderer is not set', () => {
    const render = jest.fn()
    class FooElement extends Component {
      public static is = 'foo-element'

      public render(...args: unknown[]) {
        return render(...args)
      }
    }

    setRenderer(null as any)
    const foo = new FooElement()
    ;(foo as any).isConnected = true // tslint:disable-line align whitespace
    foo.connectedCallback()
    expect(render).not.toHaveBeenCalled()
  })

  it('should not do anything if the mount callback is executed by the component is not connected to DOM', () => {
    const render = jest.fn()
    const beforeUpdate = jest.fn()
    const afterUpdate = jest.fn()
    class FooElement extends Component {
      public static is = 'foo-element'

      public render(...args: unknown[]) {
        return render(...args)
      }

      public beforeUpdate() {
        return beforeUpdate()
      }

      public afterUpdate() {
        return afterUpdate()
      }
    }

    setRenderer(jest.fn())
    const foo = new FooElement()
    foo.connectedCallback()
    expect(render).not.toHaveBeenCalled()
  })

  describe('props', () => {
    beforeEach(() => {
      setRenderer(jest.fn())
    })

    it('should define the declared props on an instance', () => {
      class FooElement extends Component {
        public static is = 'foo-element'
        public static props = ['foo', 'bar']
      }

      const foo = new FooElement()
      expect('foo' in foo).toBeTruthy()
      expect('bar' in foo).toBeTruthy()
    })

    it('should store the set prop values away until an update is performed', async () => {
      const value = Math.random()
      let wasCalledTimes = 0
      class FooElement extends Component<{foo: number}> {
        public static props = ['foo']

        public render() {
          expect(this.props.foo).toBe(value)
          wasCalledTimes++
        }
      }

      const foo = new FooElement() as any
      foo.foo = 123
      foo.foo = value
      expect(foo.foo).toBeUndefined()
      expect(foo.props.foo).toBeUndefined()
      foo.isConnected = true
      foo.connectedCallback()
      await Promise.resolve()

      expect(foo.foo).toBe(value)
      expect(foo.props.foo).toBe(value)
      expect(wasCalledTimes).toBe(1)
    })

    it('should invoke the update cycle when props are updated after mount', async () => {
      const values = [Math.random(), Math.random(), Math.random()]
      let beforeUpdateCalledTimes = 0
      let renderCalledTimes = 0
      let afterUpdateCalledTimes = 0
      class FooElement extends Component<{foo: number, bar: number}> {
        public static props = ['foo', 'bar']

        public render() {
          expect(this.props.foo).toBe(values[renderCalledTimes ? 2 : 0])
          expect(this.props.bar).toBe(values[1])
          renderCalledTimes++
        }

        public beforeUpdate(nextProps: {foo: number, bar: number}) {
          expect(this.props.foo).toBe(values[0])
          expect(nextProps.foo).toBe(values[2])
          expect(nextProps.bar).toBe(this.props.bar)
          beforeUpdateCalledTimes++
        }

        public afterUpdate(previousProps: {foo: number, bar: number}) {
          expect(previousProps.foo).toBe(values[0])
          expect(this.props.foo).toBe(values[2])
          expect(previousProps.bar).toBe(this.props.bar)
          afterUpdateCalledTimes++
        }
      }

      const foo = new FooElement() as any
      foo.foo = values[0]
      foo.bar = values[1]
      foo.isConnected = true
      foo.connectedCallback()
      expect(beforeUpdateCalledTimes).toBe(0)
      expect(renderCalledTimes).toBe(0)
      expect(afterUpdateCalledTimes).toBe(0)
      await Promise.resolve()

      expect(renderCalledTimes).toBe(1)
      foo.foo = values[2]
      expect(renderCalledTimes).toBe(1)
      await Promise.resolve()
      expect(beforeUpdateCalledTimes).toBe(1)
      expect(renderCalledTimes).toBe(2)
      expect(afterUpdateCalledTimes).toBe(1)
      expect(foo.foo).toBe(values[2])
    })

    it('should batch prop updates', async () => {
      let firstRender = true
      class FooElement extends Component<{foo: number, bar: number}> {
        public static props = ['foo', 'bar']

        public render(): any {
          if (firstRender) {
            expect(this.props.foo).toBe(1)
            expect(this.props.bar).toBe(2)
            firstRender = false
          } else {
            expect(this.props.foo).toBe(123)
            expect(this.props.bar).toBe(456)
          }
        }
      }

      const foo = new FooElement() as any
      jest.spyOn(foo, 'render')
      foo.foo = 1
      foo.bar = 2
      foo.isConnected = true
      foo.connectedCallback()
      await Promise.resolve() // on-mount render

      foo.foo = 123
      foo.bar = 456
      expect(foo.render).toHaveBeenCalledTimes(1)
      await Promise.resolve() // on-update render
      expect(foo.render).toHaveBeenCalledTimes(2)
    })
  })

  describe('attrs', () => {
    it('should batch attribute updates', async () => {
      let firstRender = true
      let thrownError = null
      class FooElement extends Component<{}, {foo: string, bar: string}> {
        public static props = []

        public render() {
          try {
            if (firstRender) {
              expect(this.attrs.foo).toBe('456')
              expect(this.attrs.bar).toBe('def')
              firstRender = false
            } else {
              expect(this.attrs.foo).toBe('123')
              expect(this.attrs.bar).toBe('abc')
            }
          } catch (error) {
            thrownError = error
          }
        }
      }

      const foo = new FooElement() as any
      jest.spyOn(foo, 'render')
      foo.attributeChangedCallback('foo', null, '456')
      foo.attributeChangedCallback('bar', null, 'def')
      foo.isConnected = true
      foo.connectedCallback()
      await Promise.resolve()

      expect(foo.render).toHaveBeenCalledTimes(1)
      foo.attributeChangedCallback('foo', '456', '123')
      foo.attributeChangedCallback('bar', 'def', 'abc')
      expect(foo.render).toHaveBeenCalledTimes(1)
      await Promise.resolve()
      expect(foo.render).toHaveBeenCalledTimes(2)
      expect(thrownError).toBeNull()
    })

    it('should update the attributes during the lifecycle correctly', async () => {
      let firstRender = true
      let thrownError = null
      class Foo extends Component<{}, {foo: string}> {
        public render() {
          try {
            if (firstRender) {
              firstRender = false
              expect(this.attrs.foo).toBe('abc')
            } else {
              expect(this.attrs.foo).toBe('def')
            }
          } catch (error) {
            thrownError = error
          }
        }

        public beforeUpdate(nextProps: {}, nextAttributes: {foo: string}): void {}

        public afterUpdate(previousProps: {}, previousAttributes: {}): void {
        }
      }

      const foo = new Foo() as any
      jest.spyOn(foo, 'render')
      jest.spyOn(foo, 'beforeUpdate')
      jest.spyOn(foo, 'afterUpdate')
      foo.attributeChangedCallback('foo', null, 'abc')
      foo.isConnected = true
      foo.connectedCallback()
      expect(foo.render).toHaveBeenCalledTimes(0)
      expect(foo.beforeUpdate).toHaveBeenCalledTimes(0)
      expect(foo.afterUpdate).toHaveBeenCalledTimes(0)
      await Promise.resolve()

      expect(foo.render).toHaveBeenCalledTimes(1)
      expect(foo.beforeUpdate).toHaveBeenCalledTimes(0)
      expect(foo.afterUpdate).toHaveBeenCalledTimes(0)
      foo.attributeChangedCallback('foo', null, 'def')
      await Promise.resolve()
      expect(foo.render).toHaveBeenCalledTimes(2)
      expect(foo.beforeUpdate).toHaveBeenCalledTimes(1)
      expect(foo.afterUpdate).toHaveBeenCalledTimes(1)

      expect(thrownError).toBeNull()
    })
  })

  describe('refs', () => {
    it('should not populate refs until requested', async () => {
      const fooElement = {
        get parentNode() {
          return foo
        },
        getAttribute(attributeName: string): string {
          expect(attributeName).toBe('ref')
          return 'fooElm'
        },
      }
      class Foo extends Component<{foo: number}, {}, {fooElm: any}> {
        public static props = ['foo']

        public render() {
          return null
        }

        public querySelectorAll(selector: string): any {
          expect(selector).toBe('[ref]')
          return [fooElement]
        }
      }
      const foo = new Foo() as any
      jest.spyOn(foo, 'querySelectorAll')
      foo.isConnected = true
      foo.foo = 1
      foo.connectedCallback()

      await Promise.resolve()
      expect(foo.querySelectorAll).toHaveBeenCalledTimes(0)
      const refs = foo.refs
      expect(foo.querySelectorAll).toHaveBeenCalledTimes(1)
      const refs2 = foo.refs
      expect(foo.querySelectorAll).toHaveBeenCalledTimes(1)
      expect(refs2).toBe(refs)
      expect(refs).toEqual({
        fooElm: fooElement,
      })
    })

    it('should update refs after every render (if requested)', async () => {
      const fooElement = {
        get parentNode() {
          return foo
        },
        getAttribute(attributeName: string): string {
          expect(attributeName).toBe('ref')
          return 'fooElm'
        },
      }
      class Foo extends Component<{foo: number}, {}, {fooElm: any}> {
        public static props = ['foo']

        public render() {
          return null
        }

        public querySelectorAll(selector: string): any {
          expect(selector).toBe('[ref]')
          return [fooElement]
        }
      }
      const foo = new Foo() as any
      jest.spyOn(foo, 'querySelectorAll')
      foo.isConnected = true
      foo.foo = 1
      foo.connectedCallback()
      await Promise.resolve()

      const refs1 = foo.refs
      expect(foo.querySelectorAll).toHaveBeenCalledTimes(1)
      foo.foo = 2
      await Promise.resolve()
      expect(foo.querySelectorAll).toHaveBeenCalledTimes(1)
      const refs2 = foo.refs
      expect(foo.querySelectorAll).toHaveBeenCalledTimes(2)
      expect(refs1).not.toBe(refs2)
      expect(refs1).toEqual(refs2)
    })
  })
})
