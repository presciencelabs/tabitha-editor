import {REGEXES} from '$lib/regexes'
import {TOKEN_TYPE, check_token_lookup, create_error_token} from './token'

/**
 *
 * @param {Token[]} tokens
 * @returns {Token[]}
 */
export function check_pairings(tokens) {
	tokens.filter(token => token.type === TOKEN_TYPE.PAIRING).forEach(check_pairing)

	return tokens

	/**
	 *
	 * @param {Token} token
	 */
	function check_pairing(token) {
		if (token.type !== TOKEN_TYPE.PAIRING) return

		const [left, right] = token.sub_tokens
		if (check_token_lookup(concept => REGEXES.IS_LEVEL_COMPLEX.test(`${concept.level}`))(left)) {
			token.sub_tokens[0] = create_error_token(left.token, 'Word must be a level 0 or 1')
		}
		if (check_token_lookup(concept => REGEXES.IS_LEVEL_SIMPLE.test(`${concept.level}`))(right)) {
			token.sub_tokens[1] = create_error_token(right.token, 'Word must be a level 2 or 3')
		}
	}
}