export default interface ITemplate {
    readonly dom: DocumentFragment
    readonly nodeProperties: INodeProperty[]
    readonly dynamicAttributes: IDynamicAttribute[]
    readonly dynamicTexts: IDynamicText[]
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

export interface IDynamicText {
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
