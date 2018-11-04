import compiler from './compiler'
import parser from './parser'
import Template from './Template'
import tokenizer from './tokenizer'

const TEMPLATE_CACHE: {[key: string]: Template} = {}

export default function tpl(strings: string[], ...placeholderValues: any[]): TemplateResult {
    const cacheKey = strings.join('')
    if (!TEMPLATE_CACHE[cacheKey]) {
        TEMPLATE_CACHE[cacheKey] = compiler(parser(tokenizer(strings)))
    }

    const template = TEMPLATE_CACHE[cacheKey]

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
