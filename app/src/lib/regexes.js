// useful references:
//
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp
//
// playground:  https://regexr.com
// visualizer:  https://jex.im/regulex

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Character_class_escape#s
const ANY_WHITESPACE = /\s+/
const NON_WHITESPACE_BEFORE_UNDERSCORE = /\S_/
const NON_WHITESPACE_BEFORE_OPENING_BRACKET = /\S\[/

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Character_class_escape#w
const ANY_WORD_EXCLUDE_OPEN_PAREN = /\b(\w+)\b(?!\()/
const NON_ALPHANUMERIC_AT_END = /_\w+[\W_]$/

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Character_class
const OPENING_OR_CLOSING_BRACKET = /[[\]]/
const OPENING_OR_CLOSING_BRACKET_G = /[[\]]/g

// [\],.]+: Matches one or more of these ',', ']', or '.'
// [^\],.]+: Matches one or more characters that are NOT ',', ']', or '.'
const RELEVANT_CLOSING_PUNCTUATION = /^([^\],.]+)+([\],.]+)$/

export const REGEXES = {
	ANY_WHITESPACE,
	ANY_WORD_EXCLUDE_OPEN_PAREN,
	NON_ALPHANUMERIC_AT_END,
	NON_WHITESPACE_BEFORE_OPENING_BRACKET,
	NON_WHITESPACE_BEFORE_UNDERSCORE,
	OPENING_OR_CLOSING_BRACKET,
	OPENING_OR_CLOSING_BRACKET_G,
	RELEVANT_CLOSING_PUNCTUATION,
}
