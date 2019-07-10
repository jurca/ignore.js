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

  it('should render itself on mount without executing update callbacks', () => {
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

    it('should store the set prop values away until an update is performed', () => {
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

      expect(foo.foo).toBe(value)
      expect(foo.props.foo).toBe(value)
      expect(wasCalledTimes).toBe(1)
    })

    it('should invoke the update cycle when props are updated after mount', () => {
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

      foo.foo = values[2]
      expect(beforeUpdateCalledTimes).toBe(1)
      expect(renderCalledTimes).toBe(2)
      expect(afterUpdateCalledTimes).toBe(1)
      expect(foo.foo).toBe(values[2])
    })
  })

  describe('attrs', () => {})

  describe('refs', () => {})
})
