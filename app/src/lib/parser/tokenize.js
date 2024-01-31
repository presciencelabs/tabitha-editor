import {CLAUSE_NOTATIONS} from './clause_notations'
import {FUNCTION_WORDS} from './function_words'
import {REGEXES} from '$lib/regexes'
import {TOKEN_TYPE, create_error_token, create_token} from './token'
import {ERRORS} from './error_messages'

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
		if (match(REGEXES.ANY_WHITESPACE)) {
			continue
		}
		tokens.push(parse_token())
	}

	return tokens

	/**
	 * @returns {Token}
	 */
	function parse_token() {
		if (match(REGEXES.WORD_START_CHAR)) {
			return word()

		} else if (match(REGEXES.OPENING_PAREN)) {
			return clause_notation()

		} else if (match(/_/)) {
			return underscore_notation()

		} else if (match_two(/\.\d/)) {
			// decimal number like .1
			return decimal_number()

		} else if (match(/[.,?!:\]]/)) {
			return closing_punctuation()

		} else if (match(/[["]/)) {
			return opening_punctuation()

		} else {
			return invalid_opening_char()
		}
	}

	function word() {
		eat(REGEXES.WORD_CHAR)
		if (match(REGEXES.OPENING_PAREN)) {
			return pronoun_referent()

		} else if (match(REGEXES.FORWARD_SLASH)) {
			return pairing()

		} else if (match_two(/\.\d/)) {
			// may be a decimal number like 2.5
			return decimal_number()

		} else {
			// any other word
			return check_boundary_for_token(TOKEN_TYPE.LOOKUP_WORD)
		}
	}

	function pronoun_referent() {
		// TODO check if first part is a pronoun, otherwise error?
		eat(REGEXES.WORD_CHAR)
		if (!match(REGEXES.CLOSING_PAREN)) {
			return error_token(ERRORS.MISSING_CLOSING_PAREN)
		}
		return check_boundary_for_token(TOKEN_TYPE.LOOKUP_WORD)
	}

	function pairing() {
		if (!match(REGEXES.WORD_START_CHAR)) {
			// simple/
			eat_until(REGEXES.TOKEN_END_BOUNDARY)
			return error_token(ERRORS.INVALID_PAIRING_SYNTAX)
		}
		// simple/complex
		eat(REGEXES.WORD_CHAR)
		return check_boundary_for_token(TOKEN_TYPE.PAIRING)
	}

	function decimal_number() {
		eat(/\d/)
		return check_boundary_for_token(TOKEN_TYPE.LOOKUP_WORD)
	}

	function clause_notation() {
		// any non-boundary character can go between the parentheses
		eat_until(REGEXES.OR(REGEXES.TOKEN_END_BOUNDARY, REGEXES.CLOSING_PAREN))
		if (!match(REGEXES.CLOSING_PAREN)) {
			// (imp
			return create_error_token(collect_text(), ERRORS.MISSING_CLOSING_PAREN)

		} else if (!is_at_end() && !peek_match(REGEXES.ANY_WHITESPACE)) {
			// (imp)[ (imp)token
			eat_until(REGEXES.TOKEN_END_BOUNDARY)
			return error_token(ERRORS.NO_SPACE_AFTER_CLAUSE_NOTATION)

		} else if (!CLAUSE_NOTATIONS.includes(collect_text())) {
			// (invalid-notation)
			return error_token(ERRORS.UNRECOGNIZED_CLAUSE_NOTATION)

		} else {
			// (imp) (implicit-situational) etc
			return simple_token(TOKEN_TYPE.NOTE)
		}
	}

	function underscore_notation() {
		// anything can go after the underscore
		// in addition to the normal boundary punctuation, [ can follow as well
		eat_until(REGEXES.OR(REGEXES.TOKEN_END_BOUNDARY, REGEXES.OPENING_BRACKET))
		return simple_token(TOKEN_TYPE.NOTE)
	}

	function closing_punctuation() {
		// Cannot be followed directly by text or [
		return check_boundary_for_token(TOKEN_TYPE.PUNCTUATION)
	}

	function opening_punctuation() {
		// Can be followed by anything
		return simple_token(TOKEN_TYPE.PUNCTUATION)
	}

	function invalid_opening_char() {
		const char = peek()
		eat_until(REGEXES.TOKEN_END_BOUNDARY)

		const messages = new Map([
			[')', ERRORS.MISSING_OPENING_PAREN],
			['/', ERRORS.INVALID_PAIRING_SYNTAX],
		])

		return error_token(messages.get(char) || ERRORS.UNRECOGNIZED_CHAR)
	}

	/**
	 * @param {TokenType} token_type
	 * @returns {Token}
	 */
	function check_boundary_for_token(token_type) {
		if (is_at_end() || peek_match(REGEXES.TOKEN_END_BOUNDARY)) {
			if (token_type == TOKEN_TYPE.LOOKUP_WORD) {
				// token token. token,
				return word_token(collect_text())
			} else if (token_type == TOKEN_TYPE.PAIRING) {
				// simple/complex simple/complex. simple/complex,
				return pairing_token(collect_text())
			} else {
				// punctuation
				return simple_token(token_type)
			}
			
		} else if (match(REGEXES.OPENING_BRACKET)) {
			// token[ .[ ][ etc
			return error_token(ERRORS.NO_SPACE_BEFORE_OPENING_BRACKET)

		} else if (match(REGEXES.CLOSING_PAREN)) {
			// token) .)
			eat_until(REGEXES.TOKEN_END_BOUNDARY)
			return error_token(ERRORS.MISSING_OPENING_PAREN)

		} else if (match_two(/_\w/)) {
			// token_note ._note
			eat_until(REGEXES.TOKEN_END_BOUNDARY)
			return error_token(ERRORS.NO_SPACE_BEFORE_UNDERSCORE)

		} else {
			// .token token_ ?token
			let text = collect_text()
			eat_until(REGEXES.TOKEN_END_BOUNDARY)
			return error_token(ERRORS.INVALID_TOKEN_END(text))
		}
	}

	function collect_text() {
		return text.substring(token_start, i)
	}
	

	/**
	 * @param {string} token
	 * @returns {Token}
	 */
	function word_token(token) {
		if (FUNCTION_WORDS.has(token.toLowerCase())) {
			return create_token(token, TOKEN_TYPE.FUNCTION_WORD)
		}
		return lookup_token(token)
	}

	/**
	 * @param {string} text
	 * @returns {Token}
	 */
	function lookup_token(text) {
		let lookup_term = text
		if (text.includes('(')) {
			// you(Paul)
			// @ts-ignore there will always be a match here
			lookup_term = text.match(REGEXES.EXTRACT_PRONOUN_REFERENT)?.[1]
		}
		const match = lookup_term.match(REGEXES.EXTRACT_WORD_REFERENT)
		// combine stem and sense
		// @ts-ignore the stem will always be there
		const stem = match?.[1]
		const sense = match?.[2] ?? ''
		return create_token(text, TOKEN_TYPE.LOOKUP_WORD, { lookup_term: `${stem}${sense}` })
	}

	/**
	 * @param {string} token 
	 * @returns {Token}
	 */
	function pairing_token(token) {
		const [left, right] = token.split('/')
		const left_token = lookup_token(left)
		const right_token = lookup_token(right)
		return create_token(token, TOKEN_TYPE.PAIRING, { pairing_left: left_token, pairing_right: right_token })
	}

	/**
	 * @param {string} message
	 * @returns {Token}
	 */
	function error_token(message) {
		return create_error_token(collect_text(), message)
	}

	/**
	 * @param {TokenType} type
	 * @returns {Token}
	 */
	function simple_token(type) {
		return create_token(collect_text(), type)
	}

	function peek() {
		return text[i]
	}

	/**
	 * peek_match() checks if the current character matches the given regex without advancing
	 * @param {RegExp} regex
	 */
	function peek_match(regex) {
		return !is_at_end() && peek().match(regex)
	}

	/**
	 * match() advances if the current character matches the given regex
	 * @param {RegExp} regex
	 */
	function match(regex) {
		if (peek_match(regex)) {
			advance()
			return true
		}
		return false
	}

	/**
	 * match_two() advances if the next two characters match the given regex
	 * @param {RegExp} regex
	 */
	function match_two(regex) {
		if ((i < text.length-2) && (text[i]+text[i+1]).match(regex)) {
			i += 2
			return true
		}
		return false
	}

	/**
	 * eat() advances greedily until a character does not match the given regex
	 * @param {RegExp} regex
	 */
	function eat(regex) {
		while (peek_match(regex)) {
			advance()
		}
	}

	/**
	 * eat_until() advances greedily until a character matches the given regex
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
