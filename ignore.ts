import Component, {IComponentStaticProps} from './Component.js'

export type Renderer = (container: Element | ShadowRoot, ui: any) => void

let renderer: null | Renderer = null

export const setRenderer = (newRenderer: Renderer) => {
  renderer = newRenderer

  if (!scheduledUpdateId && componentsScheduledForUpdate.size) {
    scheduledUpdateId = -1
    updatePendingComponents()
    scheduledUpdateId = null
  }
}

export const define = <Props, Attributes, DomReferences>(
  customElement: IComponentStaticProps<Props, Attributes, DomReferences>,
): void => {
  customElements.define(customElement.name, customElement)
}

export const update = <Props, Attributes, DomReferences>(
  component: Component<Props, Attributes, DomReferences>,
): void => {
  // TODO
}

let componentsScheduledForUpdate = new Set<Component<any, any, any>>()
let scheduledUpdateId: null | number = null

export const scheduleUpdate = <Props, Attributes, DomReferences>(
  component: Component<Props, Attributes, DomReferences>,
): void => {
  componentsScheduledForUpdate.add(component)

  if (!scheduledUpdateId && renderer) {
    scheduledUpdateId = setTimeout(() => {
      updatePendingComponents()
      scheduledUpdateId = null
    }, 0)
  }
}

function updatePendingComponents(): void {
  while (componentsScheduledForUpdate.size) {
    const componentsToUpdate = componentsScheduledForUpdate
    componentsScheduledForUpdate = new Set()
    for (const component of componentsToUpdate) {
      update(component)
    }
  }
}
