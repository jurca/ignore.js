import {IComponentStaticProps} from './Component'

export type Renderer = (container: Element | ShadowRoot, ui: any) => void

let renderer: null | Renderer = null

export const setRenderer = (newRenderer: Renderer) => {
  renderer = newRenderer
}

export const define = <Props, Attributes, DomReferences>(
  customElement: IComponentStaticProps<Props, Attributes, DomReferences>,
): void => {
  customElements.define(customElement.is, customElement)
}
