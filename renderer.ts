import {ComponentRenderer} from './Component.js'
import {TemplateResult} from './template/templateFactory.js'
import TemplateInstance from './template/TemplateInstance.js'

const templateInstanceCache: WeakMap<HTMLElement, TemplateInstance> = new WeakMap()

const renderToDom: ComponentRenderer<TemplateResult> = (renderResult: TemplateResult, mountNode: HTMLElement) => {
    const shadowRoot = mountNode.shadowRoot || mountNode.attachShadow({
        mode: 'open',
    })

    if (
        !templateInstanceCache.has(mountNode) ||
        templateInstanceCache.get(mountNode)!.template !== renderResult.template
    ) {
        while (shadowRoot.firstChild) {
            shadowRoot.removeChild(shadowRoot.firstChild)
        }
        templateInstanceCache.set(mountNode, new TemplateInstance(renderResult.template))
        shadowRoot.appendChild(templateInstanceCache.get(mountNode)!.dom)
    }

    templateInstanceCache.get(mountNode)!.setPlaceholderValues(renderResult.placeholderValues)
}
