import {
  packagePrivateAfterRenderMethod,
  packagePrivateGetPendingDataMethods,
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
  private [privatePendingProps]: Pick<Properties, keyof Properties> = {} as Pick<Properties, keyof Properties>
  private [privatePendingAttrs]: Pick<Attributes, keyof Attributes> = {} as Pick<Attributes, keyof Attributes>
  private [privateRefs]: null | Pick<DomReferences, keyof DomReferences> = null

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
  }

  public render(): any {} // tslint:disable-line no-empty

  public connectedCallback(): void {
    if (!this.isConnected) {
      return
    }

    for (const attribute of Array.from(this.attributes)) {
      (this.attrs as any)[attribute.name] = attribute.value
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

  public [packagePrivateGetPendingDataMethods](): {
    attrs: Pick<Attributes, keyof Attributes>,
    props: Pick<Properties, keyof Properties>,
  } {
    return {
      attrs: this[privatePendingAttrs],
      props: this[privatePendingProps],
    }
  }

  public [packagePrivateAfterRenderMethod](): void {
    this.props = {
      ...this.props,
      ...this[privatePendingProps],
    }
    this.attrs = {
      ...this.attrs,
      ...this[privatePendingAttrs],
    }
    this[privatePendingProps] = {} as Pick<Properties, keyof Properties>
    this[privatePendingAttrs] = {} as Pick<Attributes, keyof Attributes>

    this[privateRefs] = null
  }

  protected refs(): Pick<DomReferences, keyof DomReferences> {
    const refs = this[privateRefs] || {} as Pick<DomReferences, keyof DomReferences>
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
