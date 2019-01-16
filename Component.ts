export interface IComponentStaticProps<Props, Attributes, DomReferences> {
  useShadowDom?: boolean
  is: string
  props?: Array<keyof Props>

  new(): Component<Props, Attributes, DomReferences>
}

export default class Component<Props extends {}, Attributes extends {}, DomReferences extends {}> extends HTMLElement {
  public props: Props
  public attrs: Attributes
  public refs: DomReferences

  constructor() {
    super()

    if (
      'useShadowDom' in this.constructor &&
      (this.constructor as IComponentStaticProps<Props, Attributes, DomReferences>).useShadowDom
    ) {
      this.attachShadow({mode: 'open'})
    }

    const instance = this

    this.props = {} as Props
    this.attrs = new Proxy(Object.create(null), {
      has(target: any, propertyKey: PropertyKey): boolean {
        if (typeof propertyKey !== 'string') {
          throw new TypeError(`The attribute name must be a string, ${propertyKey.toString()} was provided`)
        }
        return (instance as HTMLElement).hasAttribute(propertyKey)
      },
      get(target: any, propertyKey: PropertyKey, receiver: any): any {
        if (typeof propertyKey !== 'string') {
          throw new TypeError(`The attribute name must be a string, ${propertyKey.toString()} was provided`)
        }
        (instance as HTMLElement).getAttribute(propertyKey)
      },
      set(target: any, propertyKey: PropertyKey, value: any, receiver: any): boolean {
        if (typeof propertyKey !== 'string') {
          throw new TypeError(`The attribute name must be a string, ${propertyKey.toString()} was provided`)
        }
        (instance as HTMLElement).setAttribute(propertyKey, value)
        return true
      },
      ownKeys(target: any): PropertyKey[] {
        return Array.from((instance as HTMLElement).attributes).map((attribute) => attribute.name)
      },
    })
    this.refs = new Proxy(Object.create(null), {
      has(target: any, propertyKey: PropertyKey): boolean {
        return !!instance.refs[propertyKey]
      },
      get(target: any, propertyKey: PropertyKey, receiver: any): any {
        if (typeof propertyKey !== 'string') {
          return null
        }
        return (instance.shadowRoot || instance as HTMLElement).querySelector(
          `[ref="${propertyKey.replace('"', '\\"')}"]`,
        )
      },
    })
  }

  public render(): any {}
}
