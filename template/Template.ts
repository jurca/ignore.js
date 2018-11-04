export default class Template {
    public readonly dom: DocumentFragment
    public readonly nodeProperties: INodeProperty[]
    public readonly dynamicAttributes: IDynamicAttribute[]
    public readonly dynamicFragments: IDynamicFragment[]

    constructor(
        dom: DocumentFragment,
        nodeProperties: INodeProperty[],
        dynamicAttributes: IDynamicAttribute[],
        dynamicFragments: IDynamicFragment[],
    ) {
        this.dom = dom
        this.nodeProperties = nodeProperties
        this.dynamicAttributes = dynamicAttributes
        this.dynamicFragments = dynamicFragments
    }
}

export type NodePath = number[]

export interface INodeProperty {
    nodePath: NodePath
    propertyName: string
    value: string
}

export interface IDynamicAttribute {
    nodePath: NodePath
    attributeName: string
    value: Array<IAttributeValueLiteralFragment | IAttributeValuePlaceholderFragment>
}

export interface IDynamicFragment {
    nodePath: NodePath
    placeholderIndex: number
}

export interface IAttributeValueLiteralFragment {
    type: AttributeValueFragmentType.LITERAL
    value: string
}

export interface IAttributeValuePlaceholderFragment {
    type: AttributeValueFragmentType.PLACEHOLDER
    placeholderIndex: number
}

export enum AttributeValueFragmentType {
    LITERAL = 'AttributeValueFragmentType.LITERAL',
    PLACEHOLDER = 'AttributeValueFragmentType.PLACEHOLDER',
}
