import Component, {IComponentStaticProps} from './Component.js'

export type Renderer = (container: Element | ShadowRoot, ui: any) => void

const livingComponents = new WeakSet<Component<any, any, any>>()
let renderer: null | Renderer = null
let componentsScheduledForUpdate = new Set<Component<any, any, any>>()
const updatedComponentsStack: Array<[Component<any, any, any>, any, any]> = []
let updateLock: boolean = false
const tick = Promise.resolve()

export const packagePrivateGetPendingDataMethod = Symbol('getPendingData')
export const packagePrivateBeforeRenderMethod = Symbol('beforeRender')

export const setRenderer = (newRenderer: Renderer) => {
  renderer = newRenderer
  updatePendingComponents()
}

export const define = <Properties, Attributes, DomReferences>(
  customElement: IComponentStaticProps<Properties, Attributes, DomReferences>,
): void => {
  customElements.define(customElement.is, customElement)
}

export const update = <Properties, Attributes, DomReferences>(
  component: Component<Properties, Attributes, DomReferences>,
): void => {
  componentsScheduledForUpdate.add(component)
  if (!renderer || updateLock) {
    return
  }

  updateLock = true
  tick.then(() => {
    try {
      updatePendingComponents()
    } finally {
      updateLock = false
    }
  })
}

function updateComponent<Properties, Attributes, DomReferences>(
  component: Component<Properties, Attributes, DomReferences>,
): void {
  const pendingData = component[packagePrivateGetPendingDataMethod]()
  const pendingProps = {
    ...component.props,
    ...pendingData.props,
  }
  const pendingAttrs = {
    ...component.attrs,
    ...pendingData.attrs,
  }
  if (livingComponents.has(component)) {
    component.beforeUpdate(pendingProps, pendingAttrs)
  }

  const previousProps = component.props
  const previousAttributes = component.attrs
  component.props = pendingProps
  component.attrs = pendingAttrs
  component[packagePrivateBeforeRenderMethod]()
  const ui = component.render()
  renderer!(component.shadowRoot || component, ui)

  // No need to check for duplicities, since no single component can be updated twice while updating the component tree.
  updatedComponentsStack.push([component, previousProps, previousAttributes])
}

function updatePendingComponents(): void {
  while (componentsScheduledForUpdate.size) {
    const componentsToUpdate = componentsScheduledForUpdate
    componentsScheduledForUpdate = new Set()
    for (const component of componentsToUpdate) {
      if (component.isConnected) {
        updateComponent(component)
      }
    }
  }

  for (const [component, previousProps, previousAttributes] of updatedComponentsStack.reverse()) {
    if (livingComponents.has(component)) {
      component.afterUpdate(previousProps, previousAttributes)
    }
    livingComponents.add(component)
  }
  updatedComponentsStack.splice(0)
}
