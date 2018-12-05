export interface IComponent<P extends object, E extends {[refName: string]: HTMLElement}, R> {
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

export interface IComponentStaticMembers<P extends object> {
    props: string[]
}

export type ComponentDeclaration<P extends object, E extends {[refName: string]: HTMLElement}, R> =
    IComponentStaticMembers<P> & {new(): IComponent<P, E, R>}

export type ComponentRenderer<R> = (renderResult: R, mountNode: HTMLElement) => void

const PRIVATE = {
    mountNode: Symbol('mountNode'),
    renderer: Symbol('renderer'),
}

export default abstract class Component<P extends object, E extends {[refName: string]: HTMLElement}, R>
        implements IComponent<P, E, R> {
    public props: P = {} as P
    public refs: E

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

    public abstract render(): R

    public renderToDom(renderResult: R, mountNode: HTMLElement): void {
        this[PRIVATE.renderer](renderResult, mountNode)
        this[PRIVATE.mountNode] = mountNode
    }

    public onMount(): void {} // tslint:disable-line no-empty

    public shouldUpdate(nextProps: P, changedProps: string[]): boolean {
        return true
    }

    public onBeforeUpdate(nextProps: P, changedProps: string[]): void {} // tslint:disable-line no-empty

    public onAfterUpdate(prevProps: P, changedProps: string[]): void {} // tslint:disable-line no-empty

    public onUnmount(): void {} // tslint:disable-line no-empty
}
