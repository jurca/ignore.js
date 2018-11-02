export interface IComponent<P extends Object, E extends {[refName: string]: HTMLElement}, R> {
    readonly props: P
    readonly refs: E

    render(): R
    renderToDom(renderResult: R, mountNode: HTMLElement): void

    onMount(): void
    shouldUpdate(nextProps: P, changedProps: string[]): boolean
    onBeforeUpdate(nextProps: P, changedProps: string[]): void
    onAfterUpdate(prevProps: P, changedProps: string[]): void
    onUnmount(): void
}

export interface IComponentStaticMembers<P extends Object> {
    props: string[]
}

export type ComponentDeclaration<P extends Object, E extends {[refName: string]: HTMLElement}, R> =
    IComponentStaticMembers<P> & {new(): IComponent<P, E, R>}

export type ComponentRenderer<R> = (renderResult: R, mountNode: HTMLElement) => void

const PRIVATE = {
    renderer: Symbol('renderer'),
    mountNode: Symbol('mountNode')
}

export abstract class Component<P, E extends {[refName: string]: HTMLElement}, R> implements IComponent<P, E, R> {
    props: P = {} as P
    refs: E

    constructor(renderer: ComponentRenderer<R>) {
        this.refs = new Proxy(Object.create(null), {
            get(target: any, elementId: string): null | HTMLElement {
                if (!this[PRIVATE.mountNode] || !this[PRIVATE.mountNode].shadowRoot) {
                    return null
                }

                return this[PRIVATE.mountNode].shadowRoot.getElementById(elementId)
            },
        }) as E

        Object.defineProperty(this, PRIVATE.renderer, {
            value: renderer,
        })
    }

    abstract render(): R

    renderToDom(renderResult: R, mountNode: HTMLElement): void {
        this[PRIVATE.renderer]()
        this[PRIVATE.mountNode] = mountNode
    }

    onMount(): void {}

    shouldUpdate(nextProps: P, changedProps: string[]): boolean {
        return true
    }

    onBeforeUpdate(nextProps: P, changedProps: string[]): void {}

    onAfterUpdate(prevProps: P, changedProps: string[]): void {}

    onUnmount(): void {}
}
