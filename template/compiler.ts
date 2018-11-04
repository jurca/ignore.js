import {AttributeValueFragmentType, ITemplateNode, TemplateNodeType} from './parser'
import Template,
    {
        IAttributeValueLiteralFragment,
        IAttributeValuePlaceholderFragment,
        IDynamicAttribute,
        IDynamicFragment,
        INodeProperty,
    } from './Template'

export default function compile(template: ITemplateNode[]): Template {
    const attributes: IDynamicAttribute[] = []
    const fragments: IDynamicFragment[] = []
    const properties: INodeProperty[] = []
    let currentPlaceholderIndex = 0
    const dom = compileFragment(template, [])

    return new Template(dom, properties, attributes, fragments)

    function compileFragment(fragment: ITemplateNode[], nodePath: number[]): DocumentFragment {
        const compiledFragment = document.createDocumentFragment()
        const decoder = document.createElement('div')
        let nodeIndex = 0
        for (const node of fragment) {
            switch (node.type) {
                case TemplateNodeType.TEXT:
                    // prevent double-encoding of special characters in text nodes
                    decoder.innerHTML = node.value
                    compiledFragment.appendChild(document.createTextNode(decoder.innerText))
                    break

                case TemplateNodeType.COMMENT:
                    // prevent double-encoding of special characters in text nodes
                    decoder.innerHTML = node.value
                    compiledFragment.appendChild(document.createComment(decoder.innerText))
                    break

                case TemplateNodeType.ELEMENT:
                    const element = document.createElement(node.elementName)
                    for (const attribute of node.attributes) {
                        if (attribute.value.every((part) => part.type === AttributeValueFragmentType.LITERAL)) {
                            const value = attribute.value.map((part) => part.value).join('')
                            if (attribute.name.charAt(0) === '.') {
                                properties.push({
                                    nodePath: nodePath.concat(nodeIndex),
                                    propertyName: attribute.name.substring(1),
                                    value,
                                })
                            } else {
                                element.setAttribute(attribute.name, value)
                            }
                        } else {
                            attributes.push({
                                attributeName: attribute.name,
                                nodePath: nodePath.concat(nodeIndex),
                                value: attribute.value.map((part) => (part.type === AttributeValueFragmentType.LITERAL ?
                                    {
                                        type: AttributeValueFragmentType.LITERAL,
                                        value: part.value,
                                    } as IAttributeValueLiteralFragment
                                    :
                                    {
                                        placeholderIndex: currentPlaceholderIndex++,
                                        type: AttributeValueFragmentType.PLACEHOLDER,
                                    } as IAttributeValuePlaceholderFragment
                                )),
                            })
                        }
                    }
                    element.appendChild(compileFragment(node.children, nodePath.concat(nodeIndex)))
                    break

                case TemplateNodeType.PLACEHOLDER:
                    compiledFragment.appendChild(document.createComment(''))
                    compiledFragment.appendChild(document.createComment(''))
                    fragments.push({
                        nodePath: nodePath.concat(nodeIndex),
                        placeholderIndex: currentPlaceholderIndex++,
                    })
                    nodeIndex++
                    break
            }
            nodeIndex++
        }
        return compiledFragment
    }
}
