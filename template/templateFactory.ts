import compiler from './compiler'
import parser from './parser'
import Template from './Template'
import tokenizer from './tokenizer'

const templateCache: {[key: string]: Template} = {}

export default function tpl(strings: string[], ...placeholderValues: any[]): TemplateResult {
    const cacheKey = strings.join('')
    if (!templateCache[cacheKey]) {
        templateCache[cacheKey] = compiler(parser(tokenizer(strings)))
    }

    const template = templateCache[cacheKey]

    return new TemplateResult(template, placeholderValues)
}

export class TemplateResult {
    public readonly template: Template
    public readonly placeholderValues: any[]

    constructor(template: Template, placeholderValues: any[]) {
        this.template = template
        this.placeholderValues = placeholderValues
    }
}
