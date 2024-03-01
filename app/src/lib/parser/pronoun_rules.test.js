import {describe, expect, test} from 'vitest'
import {PRONOUN_TAGS, check_for_pronouns} from '../parser/pronoun_rules'
import {TOKEN_TYPE, create_token} from './token'

/**
 *
 * @param {string[]} tokens
 * @returns {Token[]}
 */
function create_tokens(tokens) {
	return tokens.map(token => create_token(token, select_token_type(token)))

	/**
	 * 
	 * @param {string} token 
	 * @returns {TokenType}
	 */
	function select_token_type(token) {
		if (token.length === 1) {
			return TOKEN_TYPE.PUNCTUATION
		}
		if (token[0] === '_' || token[0] === '(') {
			return TOKEN_TYPE.NOTE
		}
		return TOKEN_TYPE.LOOKUP_WORD
	}
}

describe('invalid tokens: pronouns', () => {
	describe('valid', () => {
		test.each([
			[create_tokens(['I(Paul)']), PRONOUN_TAGS.get('i')],
			[create_tokens(['myself(Paul)']), PRONOUN_TAGS.get('myself')],
			[create_tokens(['You(Paul)']), PRONOUN_TAGS.get('you')],
			[create_tokens(['you(Paul)']), PRONOUN_TAGS.get('you')],
			[create_tokens(['we(people)']), PRONOUN_TAGS.get('we')],
			[create_tokens(['each-other(people)']), PRONOUN_TAGS.get('each-other')],
		])('%s', (test_tokens, exptected_tag) => {
			const EXPECTED_OUTPUT = test_tokens.map(token => ({...token, tag: exptected_tag}))

			expect(check_for_pronouns(test_tokens)).toEqual(EXPECTED_OUTPUT)
		})
	})

	describe('invalid: catches first person (case-insensitive)', () => {
		test.each([
			[create_tokens(['I', 'i'])],
			[create_tokens(['ME','Me','me'])],
			[create_tokens(['MY','My','my'])],
			[create_tokens(['MYSELF','Myself','myself'])],
			[create_tokens(['WE','We','We'])],
			[create_tokens(['US','Us','us'])],
			[create_tokens(['OUR','Our','our'])],
			[create_tokens(['OURSELVES','Ourselves','ourselves'])],
		])('%s', test_tokens => {
			const checked_tokens = check_for_pronouns(test_tokens)

			for (let i = 0; i < checked_tokens.length; i++) {
				expect(checked_tokens[i].token).toEqual(test_tokens[i].token)
				expect(checked_tokens[i].message).toMatch(/^First person pronouns/)
			}
		})
	})

	describe('invalid: catches second person (case-insensitive)', () => {
		test.each([
			[create_tokens(['YOU'])],
			[create_tokens(['You'])],
			[create_tokens(['you'])],
			[create_tokens(['YOUR'])],
			[create_tokens(['Your'])],
			[create_tokens(['your'])],
			[create_tokens(['YOURSELF'])],
			[create_tokens(['Yourself'])],
			[create_tokens(['yourself'])],
			[create_tokens(['YOURSELVES'])],
			[create_tokens(['Yourselves'])],
			[create_tokens(['yourselves'])],
		])('%s', test_tokens => {
			const checked_tokens = check_for_pronouns(test_tokens)

			expect(checked_tokens[0].token).toEqual(test_tokens[0].token)
			expect(checked_tokens[0].message).toMatch(/^Second person pronouns/)
		})
	})

	describe('invalid: catches third person (case-insensitive)', () => {
		test.each([
			[create_tokens(['HE'])],
			[create_tokens(['He'])],
			[create_tokens(['he'])],
			[create_tokens(['HIM'])],
			[create_tokens(['Him'])],
			[create_tokens(['him'])],
			[create_tokens(['HIS'])],
			[create_tokens(['His'])],
			[create_tokens(['his'])],
			[create_tokens(['HIMSELF'])],
			[create_tokens(['Himself'])],
			[create_tokens(['himself'])],
			[create_tokens(['SHE'])],
			[create_tokens(['She'])],
			[create_tokens(['she'])],
			[create_tokens(['HER'])],
			[create_tokens(['Her'])],
			[create_tokens(['her'])],
			[create_tokens(['HERS'])],
			[create_tokens(['Hers'])],
			[create_tokens(['hers'])],
			[create_tokens(['HERSELF'])],
			[create_tokens(['Herself'])],
			[create_tokens(['herself'])],
			[create_tokens(['ITS'])],
			[create_tokens(['Its'])],
			[create_tokens(['its'])],
			[create_tokens(['ITSELF'])],
			[create_tokens(['Itself'])],
			[create_tokens(['itself'])],
			[create_tokens(['THEY'])],
			[create_tokens(['They'])],
			[create_tokens(['they'])],
			[create_tokens(['THEM'])],
			[create_tokens(['Them'])],
			[create_tokens(['them'])],
			[create_tokens(['THEIR'])],
			[create_tokens(['Their'])],
			[create_tokens(['their'])],
			[create_tokens(['THEIRS'])],
			[create_tokens(['Theirs'])],
			[create_tokens(['theirs'])],
			[create_tokens(['THEMSELVES'])],
			[create_tokens(['Themselves'])],
			[create_tokens(['themselves'])],
		])('%s', test_tokens => {
			const checked_tokens = check_for_pronouns(test_tokens)

			expect(checked_tokens[0].token).toEqual(test_tokens[0].token)
			expect(checked_tokens[0].message).toMatch(/^Third person pronouns/)
		})
	})

	test('invalid: invalid pronoun used with referent', () => {
		const test_tokens = create_tokens(['her(Mary)', 'token(Mary)'])
		const checked_tokens = check_for_pronouns(test_tokens)

		expect(checked_tokens[0].token).toEqual(test_tokens[0].token)
		expect(checked_tokens[0].message).toMatch(/^Third person pronouns/)
		expect(checked_tokens[1].token).toEqual(test_tokens[1].token)
		expect(checked_tokens[1].message).toMatch(/^Unrecognized pronoun/)
	})

	test('invalid: catches mine, yours, ours, and each-other', () => {
		const test_tokens = create_tokens(['mine', 'yours', 'ours', 'each-other'])
		const checked_tokens = check_for_pronouns(test_tokens)

		expect(checked_tokens[0].token).toEqual(test_tokens[0].token)
		expect(checked_tokens[0].message).toMatch(/^"mine" should be/)
		expect(checked_tokens[1].token).toEqual(test_tokens[1].token)
		expect(checked_tokens[1].message).toMatch(/^"yours" should be/)
		expect(checked_tokens[2].token).toEqual(test_tokens[2].token)
		expect(checked_tokens[2].message).toMatch(/^"ours" should be/)
		expect(checked_tokens[3].token).toEqual(test_tokens[3].token)
		expect(checked_tokens[3].message).toMatch(/^"each-other" requires/)
	})
})