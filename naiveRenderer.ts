import {ComponentRenderer} from './Component'

const renderToDom: ComponentRenderer<string> = function renderToDom(renderResult: string, mountNode: HTMLElement) {
    if (mountNode.shadowRoot) {
        return
    }

    const template = document.createElement('template')
    template.innerHTML = renderResult
    const ui = document.importNode(template.content, true)

    const shadowRoot = mountNode.attachShadow({
        mode: 'open',
    })
    while (ui.firstChild) {
        shadowRoot.appendChild(ui)
    }
}
