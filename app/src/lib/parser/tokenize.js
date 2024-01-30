import {CLAUSE_NOTATIONS} from './clause_notations'
import {FUNCTION_WORDS} from './function_words'
import {REGEXES} from '$lib/regexes'
import {TOKEN_TYPE, DEFAULT_TOKEN_VALUES} from '$lib/token'

/**
 * @param {string} text
 * @returns {Token[]}
 */
export function tokenize_input(text = '') {
	let tokens = []
	let token_start = 0

	let i = 0
	while (!is_at_end()) {
		token_start = i
		if (match_regex(REGEXES.ANY_WHITESPACE)) {
			continue
		}
		tokens.push(parse_token())
	}

	return tokens

	/**
	 * @returns {Token}
	 */
	function parse_token() {
		if (match_regex(REGEXES.WORD_START_CHAR)) {
			eat(REGEXES.WORD_CHAR)
			if (match_char('(')) {
				// pronoun referent
				// TODO check if first part is a pronoun, otherwise error?
				eat(REGEXES.WORD_CHAR)
				if (match_char(')')) {
					return check_boundary_for_token(TOKEN_TYPE.WORD)
				} else {
					return create_error_token('Missing a closing parenthesis')
				}
			} else if (match_char('/')) {
				// pairing simple/complex
				if (match_regex(REGEXES.WORD_START_CHAR)) {
					eat(REGEXES.WORD_CHAR)
					return check_boundary_for_token(TOKEN_TYPE.PAIRING)
				} else {
					// simple/
					eat_until(REGEXES.TOKEN_END_BOUNDARY)
					return create_error_token('Pairings should have the form simple/complex, e.g., follower/disciple.')
				}
			} else if (peek_match_two(/\.\d/)) {
				// may be a decimal number like 2.5
				advance()	// consume the '.'
				eat(/\d/)
				return check_boundary_for_token(TOKEN_TYPE.WORD)
			} else {
				// any other word
				return check_boundary_for_token(TOKEN_TYPE.WORD)
			}

		} else if (match_char('(')) {
			// clause notation (imp)
			// any non-boundary character can go between the parentheses
			eat_until(REGEXES.OR(REGEXES.TOKEN_END_BOUNDARY, /\)/))
			if (!match_char(')')) {
				// (imp
				return create_error_token('Missing a closing parenthesis')
			} else if (!is_at_end() && !peek_match(REGEXES.ANY_WHITESPACE)) {
				// (imp)[ (imp)token
				eat_until(REGEXES.TOKEN_END_BOUNDARY)
				return create_error_token('Must include a space after a clause notation')
			} else if (!CLAUSE_NOTATIONS.includes(collect_text())) {
				// (invalid-notation)
				return create_error_token('This clause notation is not recognized')
			} else {
				// (imp) (implicit-situational) etc
				return create_simple_token(TOKEN_TYPE.NOTE)
			}

		} else if (match_char('_')) {
			// underscore notation
			// anything can go after the underscore
			// in addition to the normal boundary punctuation, [ can follow as well
			eat_until(REGEXES.OR(REGEXES.TOKEN_END_BOUNDARY, /\[/))
			return create_simple_token(TOKEN_TYPE.NOTE)

		} else if (match_char('.')) {
			if (peek_match(REGEXES.TOKEN_END_BOUNDARY)) {
				// regular punctuation use
				return create_simple_token(TOKEN_TYPE.PUNCTUATION)
			} else if (match_regex(/\d/)) {
				// decimal number like .1
				eat(/\d/)
				return check_boundary_for_token(TOKEN_TYPE.WORD)
			} else {
				// .text .[
				return check_boundary_for_token(TOKEN_TYPE.PUNCTUATION)
			}

		} else if (match_regex(/[,?!:\]]/)) {
			// Cannot be followed directly by text or [
			return check_boundary_for_token(TOKEN_TYPE.PUNCTUATION)

		} else if (match_regex(/[["]/)) {
			// Can be followed by anything
			return create_simple_token(TOKEN_TYPE.PUNCTUATION)

		} else if (match_char(')')) {
			eat_until(REGEXES.TOKEN_END_BOUNDARY)
			return create_error_token('Missing an opening parenthesis')

		} else if (match_char('/')) {
			eat_until(REGEXES.TOKEN_END_BOUNDARY)
			return create_error_token('Pairings should have the form simple/complex, e.g., follower/disciple.')

		} else {
			eat_until(REGEXES.TOKEN_END_BOUNDARY)
			return create_error_token('Unrecognized character')
		}
	}

	function collect_text() {
		return text.substring(token_start, i)
	}

	/**
	 * @param {TokenType} token_type
	 * @returns {Token}
	 */
	function create_simple_token(token_type) {
		return {
			...DEFAULT_TOKEN_VALUES,
			token: collect_text(),
			type: token_type,
		}
	}

	/**
	 * @returns {Token}
	 */
	function create_word_token() {
		let token = collect_text()
		if (FUNCTION_WORDS.has(token.toLowerCase())) {
			return {
				...DEFAULT_TOKEN_VALUES,
				token,
				type: TOKEN_TYPE.FUNCTION_WORD,
			}
		}
		return create_lookup_token(token)
	}

	/**
	 * @param {string} text
	 * @returns {Token}
	 */
	function create_lookup_token(text) {
		let lookup_term = text
		if (text.includes('(')) {
			// you(Paul)
			lookup_term = text.match(REGEXES.EXTRACT_PRONOUN_REFERENT)?.[1] || text
		}
		let match = lookup_term.match(REGEXES.EXTRACT_WORD_REFERENT)
		// combine stem and sense
		lookup_term = (match?.[1] || '') + (match?.[2] || '')
		return {
			...DEFAULT_TOKEN_VALUES,
			token: text,
			type: TOKEN_TYPE.WORD,
			lookup_term,
		}
	}
	
	/**
	 * @returns {Token}
	 */
	function create_pairing_token() {
		let token = collect_text()
		let [left, right] = token.split('/')
		return {
			...DEFAULT_TOKEN_VALUES,
			token,
			type: TOKEN_TYPE.PAIRING,
			pairing_left: create_lookup_token(left),
			pairing_right: create_lookup_token(right),
		}
	}

	/**
	 * @param {string} message
	 * @returns {Token}
	 */
	function create_error_token(message) {
		return {
			...DEFAULT_TOKEN_VALUES,
			token: collect_text(),
			type: TOKEN_TYPE.ERROR,
			message,
		}
	}

	/**
	 * @param {TokenType} token_type
	 * @returns {Token}
	 */
	function check_boundary_for_token(token_type) {
		if (is_at_end() || peek_match(REGEXES.TOKEN_END_BOUNDARY)) {
			if (token_type == TOKEN_TYPE.WORD) {
				// token token. token,
				return create_word_token()
			} else if (token_type == TOKEN_TYPE.PAIRING) {
				// simple/complex simple/complex. simple/complex,
				return create_pairing_token()
			} else {
				// punctuation
				return create_simple_token(token_type)
			}
			
		} else if (peek() == '[') {
			// token[ .[ ][ etc
			let text = collect_text()
			advance()	// consume the [
			return create_error_token(`Must have a space between ${text} and [`)
		} else if (peek() == ')') {
			// token) .)
			eat_until(REGEXES.TOKEN_END_BOUNDARY)
			return create_error_token(`Missing an opening parenthesis`)
		} else if (peek_match_two(/_\w/)) {
			// token_note ._note
			eat_until(REGEXES.TOKEN_END_BOUNDARY)
			return create_error_token('Notes notation should have a space before the underscore, e.g., ⎕_implicit')
		} else {
			// .token token_ ?token
			let text = collect_text()
			eat_until(REGEXES.TOKEN_END_BOUNDARY)
			return create_error_token(`${text} must be followed by a space or punctuation`)
		}
	}

	function peek() {
		return text[i]
	}

	/**
	 * @param {RegExp} regex
	 */
	function peek_match_two(regex) {
		return (i < text.length-2) && (text[i]+text[i+1]).match(regex)
	}

	/**
	 * @param {RegExp} regex
	 */
	function peek_match(regex) {
		return !is_at_end() && peek().match(regex)
	}

	/**
	 * @param {RegExp} regex
	 */
	function match_regex(regex) {
		if (!is_at_end() && peek().match(regex)) {
			advance()
			return true
		}
		return false
	}

	/**
	 * @param {string} char
	 */
	function match_char(char) {
		if (!is_at_end() && peek() == char) {
			advance()
			return true
		}
		return false
	}

	/**
	 * @param {RegExp} regex
	 */
	function eat(regex) {
		while (!is_at_end() && peek().match(regex)) {
			advance()
		}
	}

	/**
	 * @param {RegExp} regex
	 */
	function eat_until(regex) {
		while (!is_at_end() && !peek().match(regex)) {
			advance()
		}
	}

	function advance() {
		i++
	}

	function is_at_end() {
		return i >= text.length
	}
}
