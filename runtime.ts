import Component, {IComponentStaticProps} from './Component.js'

export type Renderer = (container: Element | ShadowRoot, ui: any) => void

const livingComponents = new WeakSet<Component<any, any, any>>()
let renderer: null | Renderer = null
let componentsScheduledForUpdate = new Set<Component<any, any, any>>()
let updateLock: boolean = false

export const packagePrivateGetPendingDataMethods = Symbol('getPendingData')
export const packagePrivateAfterRenderMethod = Symbol('afterRender')

export const setRenderer = (newRenderer: Renderer) => {
  renderer = newRenderer
  updatePendingComponents()
}

export const define = <Properties, Attributes, DomReferences>(
  customElement: IComponentStaticProps<Properties, Attributes, DomReferences>,
): void => {
  customElements.define(customElement.name, customElement)
}

export const update = <Properties, Attributes, DomReferences>(
  component: Component<Properties, Attributes, DomReferences>,
): void => {
  if (!renderer || updateLock) {
    componentsScheduledForUpdate.add(component)
    return
  }

  updateLock = true
  try {
    updateComponent(component)
  } finally {
    updateLock = false
  }

  updatePendingComponents()
}

function updateComponent<Properties, Attributes, DomReferences>(
  component: Component<Properties, Attributes, DomReferences>,
): void {
  if (livingComponents.has(component)) {
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
  renderer!(component.shadowRoot || component, ui)
  const previousProps = component.props
  const previousAttributes = component.attrs
  component[packagePrivateAfterRenderMethod]()

  if (livingComponents.has(component)) {
    component.afterUpdate(previousProps, previousAttributes)
  }
  livingComponents.add(component)
}

function updatePendingComponents(): void {
  while (componentsScheduledForUpdate.size) {
    const componentsToUpdate = componentsScheduledForUpdate
    componentsScheduledForUpdate = new Set()
    for (const component of componentsToUpdate) {
      updateComponent(component)
    }
  }
}
