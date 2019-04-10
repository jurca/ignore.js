import {scheduleUpdate, update} from './ignore.js'

export interface IComponentStaticProps<Props, Attributes, DomReferences> {
  useShadowDom?: boolean
  name: string
  observedAttributes?: Array<keyof Attributes>
  props?: Array<keyof Props>

  new(): Component<Props, Attributes, DomReferences>
}

export default class Component<Props extends {}, Attributes extends {}, DomReferences extends {}> extends HTMLElement {
  public static readonly observedAttributes: string[] = []

  public props: Props = {} as Props
  public attrs: Attributes = {} as Attributes
  public refs: DomReferences = {} as DomReferences
  public pendingProps: Props = {} as Props
  public pendingAttrs: Attributes = {} as Attributes

  constructor() {
    super()

    if (
      'useShadowDom' in this.constructor &&
      (this.constructor as IComponentStaticProps<Props, Attributes, DomReferences>).useShadowDom
    ) {
      this.attachShadow({mode: 'open'})
    }

    for (const propName of (this.constructor as IComponentStaticProps<Props, Attributes, DomReferences>).props || []) {
      Object.defineProperty(this, propName, {
        enumerable: true,
        set(value) {
          if (this.isConnected) {
            if (value !== this.props[propName]) {
              this.pendingProps[propName] = value
              scheduleUpdate(this)
            }
          } else {
            this.props[propName] = value
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
      this.attrs[attribute.name] = attribute.value
    }

    update(this)

    const referencedElements = Array.from((this.shadowRoot || this).querySelectorAll('[ref]'))
    for (const referencedElement of referencedElements) {
      this.refs[referencedElement.getAttribute('ref')!] = referencedElement
    }
  }

  public disconnectedCallback(): void {} // tslint:disable-line no-empty

  public adoptedCallback(): void {} // tslint:disable-line no-empty

  public attributeChangedCallback(name, oldValue, newValue): void {
    // the callback does get called even if the attribute is set to its current value
    if (this.isConnected && newValue !== oldValue) {
      this.pendingAttrs[name] = newValue
      scheduleUpdate(this)
    }
  }
}
