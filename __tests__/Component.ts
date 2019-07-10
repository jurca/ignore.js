// tslint:disable max-classes-per-file

import {Component, define} from '../ignore.js'

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
})
