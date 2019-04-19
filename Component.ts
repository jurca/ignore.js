import {
  packagePrivateAfterRenderMethod,
  packagePrivateGetPendingDataMethods,
  scheduleUpdate,
  update,
} from './runtime.js'

export interface IComponentStaticProps<Properties, Attributes, DomReferences> {
  useShadowDom?: boolean
  name: string
  observedAttributes?: Array<keyof Attributes>
  props?: Array<keyof Properties>

  new(): Component<Properties, Attributes, DomReferences>
}

// This is simpler than using weak maps
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
              scheduleUpdate(this)
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
      scheduleUpdate(this)
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

    this[privateRefs] = {} as Pick<DomReferences, keyof DomReferences>
    const referencedElements = Array.from((this.shadowRoot || this).querySelectorAll('[ref]'))
    for (const referencedElement of referencedElements) {
      (this[privateRefs] as any)[referencedElement.getAttribute('ref')!] = referencedElement
    }
  }

  protected refs(): Pick<DomReferences, keyof DomReferences> {
    return this[privateRefs] || {} as Pick<DomReferences, keyof DomReferences>
  }
}
