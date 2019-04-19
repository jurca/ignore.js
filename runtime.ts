import Component, {IComponentStaticProps} from './Component.js'

export type Renderer = (container: Element | ShadowRoot, ui: any) => void

const livingComponents = new WeakSet<Component<any, any, any>>()
let renderer: null | Renderer = null
let componentsScheduledForUpdate = new Set<Component<any, any, any>>()
let scheduledUpdateId: null | number = null

export const packagePrivateGetPendingDataMethods = Symbol('getPendingData')
export const packagePrivateAfterRenderMethod = Symbol('afterRender')

export const setRenderer = (newRenderer: Renderer) => {
  renderer = newRenderer

  if (!scheduledUpdateId && componentsScheduledForUpdate.size) {
    scheduledUpdateId = -1
    updatePendingComponents()
    scheduledUpdateId = null
  }
}

export const define = <Properties, Attributes, DomReferences>(
  customElement: IComponentStaticProps<Properties, Attributes, DomReferences>,
): void => {
  customElements.define(customElement.name, customElement)
}

export const update = <Properties, Attributes, DomReferences>(
  component: Component<Properties, Attributes, DomReferences>,
): void => {
  if (!renderer) {
    scheduleUpdate(component)
    return
  }

  if (!livingComponents.has(component)) {
    livingComponents.add(component)
  } else {
    const pendingData = component[packagePrivateGetPendingDataMethods]()
    const pendingProps = {
      ...component.props,
      ...pendingData.props,
    }
    const pendingAttrs = {
      ...component.attrs,
      ...pendingData.attrs,
    }
    component.beforeUpdate(pendingProps, pendingAttrs)
  }

  const ui = component.render()
  renderer(component.shadowRoot || component, ui)
  const previousProps = component.props
  const previousAttributes = component.attrs
  component[packagePrivateAfterRenderMethod]()

  component.afterUpdate(previousProps, previousAttributes)
}

export const scheduleUpdate = <Properties, Attributes, DomReferences>(
  component: Component<Properties, Attributes, DomReferences>,
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
