export function tokenize(inputStrings: string[]): IToken[] {
    const result: IToken[] = []

    let stringIndex = 0
    let tokenIndex = 0
    let insideElement = false
    let currentAttributeDelimiter: null | '"' | '\'' = null
    let lastOpenedElementName = ''
    while (stringIndex < inputStrings.length && tokenIndex < inputStrings[stringIndex].length) {
        const currentFullString = inputStrings[stringIndex]
        const currentString = currentFullString.substring(tokenIndex)
        if (!currentString) {
            stringIndex++
            tokenIndex = 0
            result.push({
                type: TokenType.PLACEHOLDER,
                value: '',
            })
            continue
        }

        if (currentAttributeDelimiter) { // we have a placeholder(s) inside an attribute's value
            if (currentString.includes(currentAttributeDelimiter)) {
                const valueEndIndex = currentString.indexOf(currentAttributeDelimiter)
                result.push({
                    type: TokenType.ATTRIBUTE_NAME,
                    value: currentString.substring(0, valueEndIndex),
                })
                tokenIndex += valueEndIndex + 1
            } else {
                result.push({
                    type: TokenType.ATTRIBUTE_VALUE,
                    value: currentString,
                })
                tokenIndex = currentString.length
            }
            continue
        }

        if (insideElement) {
            const whiteSpaceMatch = currentString.match(WHITESPACE_MATCHER)
            if (whiteSpaceMatch) {
                tokenIndex += whiteSpaceMatch[0].length
                continue
            }

            const attributeNameMatch = currentString.match(/^[^=>/\s]+/)
            if (attributeNameMatch) {
                result.push({
                    type: TokenType.ATTRIBUTE_NAME,
                    value: attributeNameMatch[0],
                })
                tokenIndex += attributeNameMatch[0].length
                if (!/^\s*=/.test(currentFullString.substring(tokenIndex))) { // boolean attribute
                    continue
                }

                tokenIndex = currentFullString.indexOf('=', tokenIndex) + 1
                const preValueWhitespaceMatch = currentFullString.substring(tokenIndex).match(WHITESPACE_MATCHER)
                if (preValueWhitespaceMatch) {
                    tokenIndex += preValueWhitespaceMatch[0].length
                }

                const attributeMatch = currentFullString.substring(tokenIndex).match(/^(?:"([^"]*)"|'([^']*)'|(\S*))/)
                if (attributeMatch) {
                    const value = attributeMatch[1] || attributeMatch[2] || attributeMatch[3]
                    result.push({
                        type: TokenType.ATTRIBUTE_VALUE,
                        value,
                    })
                } else if (tokenIndex === currentFullString.length) { // the value will be set by the placeholder
                    continue
                } else {
                    const nextChar = currentFullString.charAt(tokenIndex)
                    if (!['"', '\''].includes(nextChar)) { // can this really happen? (see attributeMatch, 3rd option)
                        throw new Error(`Parsing failed in fragment #${stringIndex}, position ${tokenIndex}`)
                    }

                    currentAttributeDelimiter = nextChar as '"' | '\''
                    tokenIndex += 1

                    if (tokenIndex < currentFullString.length) {
                        result.push({
                            type: TokenType.ATTRIBUTE_VALUE,
                            value: currentFullString.substring(tokenIndex),
                        })
                    }
                    tokenIndex = currentFullString.length
                }
            }

            if (/^\/?>/.test(currentString)) {
                result.push({
                    type: currentString.charAt(0) === '/' ? TokenType.ELEMENT_END : TokenType.ELEMENT_START_CLOSE,
                    value: lastOpenedElementName,
                })
                tokenIndex += currentString.indexOf('>') + 1
                insideElement = false
            }

            throw new Error(`Parsing failed in fragment #${stringIndex}, position ${tokenIndex}`)
        } else {
            const matchers = Object.entries(TOKEN_MATCHER)
            const matches = matchers.map((matcher) => currentString.match(matcher[1]))
            const bestMatchLength = Math.max(...matches.filter((match) => match).map((match) => (match!)[0].length))
            const bestMatchIndex = matches.findIndex((match) => match ? match[0].length === bestMatchLength : false)
            if (bestMatchIndex === -1) {
                throw new Error(`Parsing failed in fragment #${stringIndex}, position ${tokenIndex}`)
            }

            const bestMatch = (matches[bestMatchIndex]!)[0]
            switch (matchers[bestMatchIndex][1]) {
                case TOKEN_MATCHER.TEXT:
                    result.push({
                        type: TokenType.TEXT,
                        value: bestMatch,
                    })
                    tokenIndex += bestMatch.length
                    break

                case TOKEN_MATCHER.COMMENT:
                    result.push({
                        type: TokenType.COMMENT,
                        value: bestMatch.slice(4, -3),
                    })
                    tokenIndex += bestMatch.length
                    break

                case TOKEN_MATCHER.ELEMENT_START_OPEN:
                    tokenIndex += bestMatch.length
                    if (WHITESPACE_MATCHER.test(currentFullString.substring(tokenIndex))) {
                        const whitespaceMatch = currentFullString.substring(tokenIndex).match(WHITESPACE_MATCHER)!
                        tokenIndex += whitespaceMatch[0].length
                    }
                    const elementNameMatch = currentFullString.substring(tokenIndex).match(/^[\S+]/)
                    if (!elementNameMatch) {
                        throw new Error(`Missing element name in fragment #${stringIndex}, position ${tokenIndex}`)
                    }
                    lastOpenedElementName = elementNameMatch[0]
                    result.push({
                        type: TokenType.ELEMENT_START_OPEN,
                        value: lastOpenedElementName,
                    })
                    tokenIndex += lastOpenedElementName.length
                    insideElement = true
                    break

                case TOKEN_MATCHER.ELEMENT_END:
                    tokenIndex += bestMatch.length
                    const tokenEnd = currentFullString.indexOf('>', tokenIndex)
                    result.push({
                        type: TokenType.ELEMENT_END,
                        value: currentFullString.substring(tokenIndex, tokenEnd).trim(),
                    })
                    tokenIndex = tokenEnd + 1
                    break
            }
        }
    }

    return result
}

interface IToken {
    type: TokenType,
    value: string,
}

const WHITESPACE_MATCHER = /^\s+/
const TOKEN_MATCHER = {
    COMMENT: /^<!--[^>]*-->/,
    ELEMENT_END: /^<\/[^>]+>/,
    ELEMENT_START_OPEN: /^</,
    TEXT: /^[^<]+/,
}

enum TokenType {
    TEXT = 'TokenType.TEXT',
    COMMENT = 'TokenType.COMMENT',
    ELEMENT_START_OPEN = 'TokenType.ELEMENT_START_OPEN',
    ELEMENT_START_CLOSE = 'TokenType.ELEMENT_START_CLOSE',
    ELEMENT_END = 'TokenType.ELEMENT_START_END',
    ATTRIBUTE_NAME = 'TokenType.ATTRIBUTE_NAME',
    ATTRIBUTE_VALUE = 'TokenType.ATTRIBUTE_VALUE',
    PLACEHOLDER = 'TokenType.PLACEHOLDER',
}
