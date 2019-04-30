import {
  packagePrivateAfterRenderMethod,
  packagePrivateGetPendingDataMethod,
  update,
} from './runtime.js'

export interface IComponentStaticProps<Properties, Attributes, DomReferences> {
  useShadowDom?: boolean
  name: string
  observedAttributes?: Array<keyof Attributes>
  props?: Array<keyof Properties>

  new(): Component<Properties, Attributes, DomReferences>
}

// This is simpler than using weak maps, even though these are not hard privates with full encapsulation... it's good
// enough here.
const privateRefs = Symbol('ref')
const privatePendingProps = Symbol('pendingProps')
const privatePendingAttrs = Symbol('pendingAttrs')

export default class Component<
  Properties extends {},
  Attributes extends {},
  DomReferences extends {},
> extends HTMLElement {
  public static readonly observedAttributes: string[] = []

  public props: Properties = {} as Properties
  public attrs: Attributes = {} as Attributes
  private [privatePendingProps]: Partial<Properties> = {}
  private [privatePendingAttrs]: Partial<Attributes> = {}
  private [privateRefs]: null | Partial<DomReferences> = null

  constructor() {
    super()

    const componentClass = this.constructor as IComponentStaticProps<Properties, Attributes, DomReferences>
    if (componentClass.useShadowDom) {
      this.attachShadow({mode: 'open'})
    }

    for (const propName of componentClass.props || []) {
      Object.defineProperty(this, propName, {
        enumerable: true,
        set(value) {
          if (this.isConnected) {
            if (value !== this.props[propName]) {
              this[privatePendingProps][propName] = value
              update(this)
            }
          } else {
            this[privatePendingProps][propName] = value
          }
        },
        get() {
          return this.props[propName]
        },
      })
    }

    for (const privateSymbol of [privatePendingProps, privatePendingAttrs, privateRefs]) {
      Object.defineProperty(this, privateSymbol, {
        configurable: false,
        enumerable: false,
      })
    }
  }

  public render(): any {} // tslint:disable-line no-empty

  public connectedCallback(): void {
    if (!this.isConnected) {
      return
    }

    update(this)
  }

  public beforeUpdate(nextProps: Properties, nextAttributes: Attributes): void {} // tslint:disable-line no-empty

  public afterUpdate(previousProps: Properties, previousAttributes: Attributes): void {} // tslint:disable-line no-empty

  public disconnectedCallback(): void {} // tslint:disable-line no-empty

  public adoptedCallback(): void {} // tslint:disable-line no-empty

  public attributeChangedCallback(name: string, oldValue: null | string, newValue: null | string): void {
    // the callback does get called even if the attribute is set to its current value
    if (this.isConnected && newValue !== oldValue) {
      (this[privatePendingAttrs] as any)[name] = newValue
      update(this)
    }
  }

  public [packagePrivateGetPendingDataMethod](): {
    attrs: Partial<Attributes>,
    props: Partial<Properties>,
  } {
    return {
      attrs: this[privatePendingAttrs],
      props: this[privatePendingProps],
    }
  }

  public [packagePrivateAfterRenderMethod](newProps: Properties, newAttrs: Attributes): void {
    this.props = newProps
    this.attrs = newAttrs
    this[privatePendingProps] = {} as Pick<Properties, keyof Properties>
    this[privatePendingAttrs] = {} as Pick<Attributes, keyof Attributes>

    this[privateRefs] = null
  }

  protected get refs(): Partial<DomReferences> {
    const refs: Partial<DomReferences> = this[privateRefs] || {}
    if (!this[privateRefs]) {
      const uiRoot = this.shadowRoot || this
      const referencedElements = Array.from(uiRoot.querySelectorAll('[ref]'))
      referencedElementsCycle:
      for (const referencedElement of referencedElements) {
        let elementOwner = referencedElement.parentNode
        while (elementOwner && elementOwner !== uiRoot) {
          if (
            elementOwner.nodeType === Node.ELEMENT_NODE &&
            !(elementOwner as Element).shadowRoot &&
            elementOwner.nodeName.includes('-')
          ) {
            // We do not want to pierce the encapsulation of components not utilizing shadow DOM
            continue referencedElementsCycle
          }
          elementOwner = elementOwner.parentNode
        }
        (this[privateRefs] as any)[referencedElement.getAttribute('ref')!] = referencedElement
      }
      this[privateRefs] = refs
    }

    return refs
  }
}
