import {IToken, TokenType} from './tokenizer.js'

export default function parse(tokens: IToken[]): ITemplateNode[] {
    const result: ITemplateNode[] = []
    let currentFragment = result
    const fragmentStack: ITemplateNode[][] = []

    for (const token of tokens) {
        switch (token.type) {
            case TokenType.TEXT:
                currentFragment.push({
                    attributes: [],
                    children: [],
                    elementName: '',
                    type: TemplateNodeType.TEXT,
                    value: token.value,
                })
                break

            case TokenType.COMMENT:
                currentFragment.push({
                    attributes: [],
                    children: [],
                    elementName: '',
                    type: TemplateNodeType.COMMENT,
                    value: token.value,
                })
                break

            case TokenType.ELEMENT_START_OPEN:
                currentFragment.push({
                    attributes: [],
                    children: [],
                    elementName: token.value,
                    type: TemplateNodeType.ELEMENT,
                    value: '',
                })
                break

            case TokenType.ELEMENT_START_CLOSE:
                fragmentStack.push(currentFragment)
                currentFragment = peek(currentFragment).children
                break

            case TokenType.ELEMENT_END:
                if (token.value === (peek(currentFragment) && peek(currentFragment).elementName)) {
                    break // self-closing elemet
                }

                if (!fragmentStack.length) {
                    throw new Error(`Parsing failed: encountered the end of the ${token.value} on the top level`)
                }
                if (token.value !== peek(peek(fragmentStack)).elementName) {
                    throw new Error(
                        `Parsing failed: encountered the end of the ${token.value} element inside the ` +
                        `${peek(peek(fragmentStack)).elementName} element.`,
                    )
                }
                currentFragment = fragmentStack.pop()!
                break

            case TokenType.ATTRIBUTE_NAME:
                peek(currentFragment).attributes.push({
                    name: token.value,
                    value: [],
                })
                break

            case TokenType.ATTRIBUTE_VALUE:
                peek(peek(currentFragment).attributes).value.push({
                    type: AttributeValueFragmentType.LITERAL,
                    value: token.value,
                })
                break

            case TokenType.PLACEHOLDER:
                if (isSettingAttribute(token)) {
                    peek(peek(currentFragment).attributes).value.push({
                        type: AttributeValueFragmentType.PLACEHOLDER,
                        value: '',
                    })
                } else {
                    currentFragment.push({
                        attributes: [],
                        children: [],
                        elementName: '',
                        type: TemplateNodeType.PLACEHOLDER,
                        value: '',
                    })
                }
                break

            default:
                throw new Error(`Unknown token type: ${token.type}`)
        }
    }

    return result

    function isSettingAttribute(currentToken: IToken): boolean {
        const currentTokenIndex = tokens.indexOf(currentToken)
        const previousTokens = tokens.slice(0, currentTokenIndex).reverse()
        const lastAttributeNameTokenIndex = previousTokens.findIndex(
            (token) => token.type === TokenType.ATTRIBUTE_NAME,
        )
        const lastElementStartCloseTokenIndex = previousTokens.findIndex(
            (token) => token.type === TokenType.ELEMENT_START_CLOSE,
        )
        const lastElementEndTokenIndex = previousTokens.findIndex(
            (token) => token.type === TokenType.ELEMENT_END,
        )
        const lastSignificantTokenIndex = Math.min(...[
            lastAttributeNameTokenIndex,
            lastElementStartCloseTokenIndex,
            lastElementEndTokenIndex,
        ].filter((index) => index > -1))
        return lastSignificantTokenIndex === lastAttributeNameTokenIndex && lastAttributeNameTokenIndex > -1
    }
}

export interface ITemplateNode {
    type: TemplateNodeType
    elementName: string
    attributes: IAttribute[]
    children: ITemplateNode[]
    value: string
}

export enum TemplateNodeType {
    TEXT = 'TemplateNodeType.TEXT',
    COMMENT = 'TemplateNodeType.COMMENT',
    ELEMENT = 'TemplateNodeType.ELEMENT',
    PLACEHOLDER = 'TemplateNodeType.PLACEHOLDER',
}

export interface IAttribute {
    name: string
    value: IAttributeValueFragment[]
}

export interface IAttributeValueFragment {
    type: AttributeValueFragmentType
    value: string
}

export enum AttributeValueFragmentType {
    LITERAL = 'AttributeValueFragmentType.LITERAL',
    PLACEHOLDER = 'AttributeValueFragmentType.PLACEHOLDER',
}

function peek<T>(array: T[]): T {
    return array[array.length - 1] // not necessarily non-null, but should be safe in this case
}
