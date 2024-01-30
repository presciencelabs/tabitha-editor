const ERROR = 'Error'
const PUNCTUATION = 'Punctuation'
const NOTE = 'Note'
const FUNCTION_WORD = 'FunctionWord'
const WORD = 'Word'
const PAIRING = 'Pairing'

export const TOKEN_TYPE = {
    ERROR,
    PUNCTUATION,
    NOTE,
    FUNCTION_WORD,
    WORD,
    PAIRING,
}

export const DEFAULT_TOKEN_VALUES = {
    message: '',
    lookup_term: '',
    pairing_left: null,
    pairing_right: null,
}

/**
 * 
 * @param {string} token 
 * @param {string} message 
 */
export function error_token(token, message) {
    return {
        ...DEFAULT_TOKEN_VALUES,
        token,
        type: TOKEN_TYPE.ERROR,
        message,
    }
}