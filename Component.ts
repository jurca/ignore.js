import {scheduleUpdate, update} from './ignore.js'

export interface IComponentStaticProps<Properties, Attributes, DomReferences> {
  useShadowDom?: boolean
  name: string
  observedAttributes?: Array<keyof Attributes>
  props?: Array<keyof Properties>

  new(): Component<Properties, Attributes, DomReferences>
}

export default class Component<
  Properties extends {},
  Attributes extends {},
  DomReferences extends {},
> extends HTMLElement {
  public static readonly observedAttributes: string[] = []

  public props: Properties = {} as Properties
  public attrs: Attributes = {} as Attributes
  public refs: DomReferences = {} as DomReferences
  public pendingProps: Properties = {} as Properties
  public pendingAttrs: Attributes = {} as Attributes

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
              this.pendingProps[propName] = value
              scheduleUpdate(this)
            }
          } else {
            this.pendingProps[propName] = value
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
      this.pendingAttrs[attribute.name] = attribute.value
    }

    update(this)
  }

  public beforeUpdate(nextProps: Properties, nextAttributes: Attributes): void {} // tslint:disable-line no-empty

  public afterUpdate(previousProps: Properties, previousAttributes: Attributes): void {} // tslint:disable-line no-empty

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
