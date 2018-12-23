import {ComponentRenderer} from './Component.js'

export const renderToDom: ComponentRenderer<string> = (renderResult: string, mountNode: HTMLElement) => {
    const template = document.createElement('template')
    template.innerHTML = renderResult
    const ui = document.importNode(template.content, true)

    const shadowRoot = mountNode.shadowRoot || mountNode.attachShadow({
        mode: 'open',
    })
    shadowRoot.innerHTML = ''
    while (ui.firstChild) {
        shadowRoot.appendChild(ui)
    }
}
