import {REGEXES} from '$lib/regexes'
import {TOKEN_TYPE, create_error_token} from './token'

const FIRST_PERSON = ['i', 'me', 'my', 'myself', 'we', 'us', 'our', 'ourselves']
const SECOND_PERSON = ['you', 'your', 'yourself', 'yourselves']
const THIRD_PERSON = ['he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves']

const PRONOUN_MESSAGES = new Map([
	['mine', '"mine" should be replaced with "my() X", e.g., That book is my(Paul\'s) book.'],
	['ours', '"ours" should be replaced with "our() X", e.g., That book is our(Paul\'s) book.'],
	['yours', '"yours" should be replaced with "your() X", e.g., That book is your(Paul\'s) book.'],
	['each-other', '"each-other" requires its respective Noun in parentheses, e.g., each-other(people).'],
])
FIRST_PERSON.forEach(p => PRONOUN_MESSAGES.set(p, 'First person pronouns require their respective Noun in parentheses, e.g., I(Paul).'))
SECOND_PERSON.forEach(p => PRONOUN_MESSAGES.set(p, 'Second person pronouns require their respective Noun in parentheses, e.g., you(Paul).'))
THIRD_PERSON.forEach(p => PRONOUN_MESSAGES.set(p, 'Third person pronouns should be replaced with the Noun they represent, e.g., Paul (instead of him).'))

export const PRONOUN_TAGS = new Map([
	['i', 'first_person|singular'],
	['me', 'first_person|singular'],
	['my', 'first_person|singular'],
	['myself', 'first_person|singular|reflexive'],
	['we', 'first_person|plural'],
	['us', 'first_person|plural'],
	['our', 'first_person|plural'],
	['ourselves', 'first_person|plural|reflexive'],
	['you', 'second_person'],
	['your', 'second_person'],
	['yourself', 'second_person|singular|reflexive'],
	['yourselves', 'second_person|plural|reflexive'],
	['each-other', 'reciprocal'],
])

/**
 * 
 * @param {Token[]} tokens 
 * @returns {Token[]}
 */
export function check_for_pronouns(tokens) {
	return tokens.map(check)

	/**
	 * 
	 * @param {Token} token 
	 */
	function check(token) {
		if (token.type === TOKEN_TYPE.ERROR) {
			return token
		}

		const normalized_token = token.token.toLowerCase()

		if (PRONOUN_MESSAGES.has(normalized_token)) {
			// @ts-ignore
			return create_error_token(token.token, PRONOUN_MESSAGES.get(normalized_token))
		}

		const referent_match = normalized_token.match(REGEXES.EXTRACT_PRONOUN_REFERENT)
		if (referent_match) {
			return check_referent(token, referent_match[1])
		}

		return token
	}

	/**
	 * 
	 * @param {Token} token 
	 * @param {string} pronoun 
	 * @returns {Token}
	 */
	function check_referent(token, pronoun) {
		if (PRONOUN_TAGS.has(pronoun)) {
			// @ts-ignore
			return {...token, tag: PRONOUN_TAGS.get(pronoun)}
		} else if (PRONOUN_MESSAGES.has(pronoun)) {
			// @ts-ignore
			return create_error_token(token.token, PRONOUN_MESSAGES.get(pronoun))
		} else {
			return create_error_token(token.token, `Unrecognized pronoun "${pronoun}"`)
		}
	}
}