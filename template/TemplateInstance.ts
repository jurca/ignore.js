import Template, {AttributeValueFragmentType as TemplateAttributeValueFragmentType} from './Template'
import {TemplateResult} from './templateFactory'

export default class TemplateInstance {
    public readonly template: Template
    public readonly dom: DocumentFragment
    private readonly attributes: IDynamicAttribute[]
    private readonly fragments: IDynamicFragment[]

    constructor(template: Template) {
        this.template = template
        this.dom = template.dom.cloneNode(true) as DocumentFragment
        for (const property of template.nodeProperties) {
            const element = getNode(this.dom, property.nodePath)
            element[property.propertyName] = property.value
        }
        this.attributes = template.dynamicAttributes.map((attribute) => ({
            attributeName: attribute.attributeName,
            element: getNode(this.dom, attribute.nodePath) as HTMLElement,
            value: attribute.value.map((part) => ({
                placeholderIndex: 'placeholderIndex' in part ? part.placeholderIndex : -1,
                type: part.type === TemplateAttributeValueFragmentType.LITERAL ?
                    AttributeValueFragmentType.LITERAL
                    :
                    AttributeValueFragmentType.PLACEHOLDER,
                value: 'value' in part ? part.value : '',
            })),
        }))
        this.fragments = template.dynamicFragments.map((fragment) => ({
            end: getNode(this.dom, fragment.nodePath).nextSibling as Comment,
            placeholderIndex: fragment.placeholderIndex,
            start: getNode(this.dom, fragment.nodePath) as Comment,
        }))
    }

    public setPlaceholderValues(values: any[]) {
        for (const attribute of this.attributes) {
            const isSingularPlaceholderValue = (
                attribute.value.length === 1 &&
                attribute.value[0].type === AttributeValueFragmentType.PLACEHOLDER
            )
            if (
                attribute.attributeName.charAt(0) !== '.' &&
                isSingularPlaceholderValue &&
                [undefined, null, false].includes(values[attribute.value[0].placeholderIndex])
            ) {
                attribute.element.removeAttribute(attribute.attributeName)
                continue
            }

            const value = isSingularPlaceholderValue ?
                values[attribute.value[0].placeholderIndex]
                :
                attribute.value.map((part) => {
                    return part.type === AttributeValueFragmentType.LITERAL ? part.value : values[part.placeholderIndex]
                }).join('')
            if (attribute.attributeName.charAt(0) === '.') {
                attribute.element[attribute.attributeName.substring(1)] = value
            } else {
                attribute.element.setAttribute(attribute.attributeName, value)
            }
        }
        for (const fragment of this.fragments) {
            const container = fragment.start.parentNode!
            while (fragment.start.nextSibling !== fragment.end) {
                container.removeChild(fragment.start.nextSibling!)
            }
            const rawValue = values[fragment.placeholderIndex]
            container.insertBefore(preRenderValue(rawValue), fragment.end)
        }
    }
}

function preRenderValue(value: any): Node {
    if (value instanceof Node) {
        return value
    }

    if (value instanceof Array) {
        const result = document.createDocumentFragment()
        for (const part of value) {
            result.appendChild(preRenderValue(part))
        }
        return result
    }

    if (value instanceof TemplateResult) {
        const template = new TemplateInstance(value.template)
        template.setPlaceholderValues(value.placeholderValues)
        return preRenderValue(template)
    }

    if (value instanceof TemplateInstance) {
        return value.dom
    }

    return document.createTextNode(`${value}`)
}

function getNode(rootFragment: Node, nodePath: number[]): Node {
    if (!nodePath.length) {
        return rootFragment
    }

    return getNode(rootFragment.childNodes[nodePath[0]], nodePath.slice(1))
}

interface IDynamicFragment {
    start: Comment
    end: Comment
    placeholderIndex: number
}

interface IDynamicAttribute {
    element: HTMLElement
    attributeName: string
    value: IAttributeValueFragment[]
}

interface IAttributeValueFragment {
    type: AttributeValueFragmentType,
    value: string,
    placeholderIndex: number,
}

enum AttributeValueFragmentType {
    LITERAL = 'AttributeValueFragmentType.LITERAL',
    PLACEHOLDER = 'AttributeValueFragmentType.PLACEHOLDER',
}
