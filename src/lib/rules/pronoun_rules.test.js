import { describe, expect, test } from 'vitest'
import { PRONOUN_TAGS, PRONOUN_RULES } from './pronoun_rules'
import { TOKEN_TYPE, create_clause_token, create_token, flatten_sentence } from '../token'
import { apply_rules } from './rules_processor'
import { expect_error_to_match } from '$lib/test_helps'

/**
 *
 * @param {string[]} tokens
 * @returns {Token[]}
 */
function create_tokens(tokens) {
	return tokens.map(token => create_token(token, TOKEN_TYPE.LOOKUP_WORD))
}

/**
 * @param {string} pronoun
 * @param {string} referent
 * @param {string?} referent_lookup
 * @returns {Token}
 */
function create_pronoun_token(pronoun, referent, referent_lookup=null) {
	const pronoun_token = create_token(pronoun, TOKEN_TYPE.FUNCTION_WORD)
	return create_token(referent, TOKEN_TYPE.LOOKUP_WORD, { lookup_term: referent_lookup ?? referent, pronoun: pronoun_token })
}

/**
 * 
 * @param {Token[]} tokens 
 * @returns {Sentence}
 */
function create_sentence(tokens) {
	return { clause: create_clause_token(tokens, { 'clause_type': 'main_clause' }) }
}

describe('invalid tokens: pronouns', () => {
	describe('valid', () => {
		test.each([
			[[create_pronoun_token('I', 'Paul')], PRONOUN_TAGS.get('i')],
			[[create_pronoun_token('myself', 'Paul')], PRONOUN_TAGS.get('myself')],
			[[create_pronoun_token('You', 'Paul')], PRONOUN_TAGS.get('you')],
			[[create_pronoun_token('you', 'Paul')], PRONOUN_TAGS.get('you')],
			[[create_pronoun_token('we', 'people')], PRONOUN_TAGS.get('we')],
			[[create_pronoun_token('each-other', 'people')], PRONOUN_TAGS.get('each-other')],
		])('%s', (test_tokens, exptected_tag) => {
			const INPUT = [create_sentence(test_tokens)]
			const EXPECTED_OUTPUT = test_tokens.map(token => ({ ...token, tag: { 'pronoun': exptected_tag } }))

			const checked_tokens = apply_rules(INPUT, PRONOUN_RULES).flatMap(flatten_sentence)

			expect(checked_tokens).toEqual(EXPECTED_OUTPUT)
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
			const INPUT = [create_sentence(test_tokens)]
			const checked_tokens = apply_rules(INPUT, PRONOUN_RULES).flatMap(flatten_sentence)

			for (let i = 0; i < checked_tokens.length; i++) {
				expect(checked_tokens[i].token).toEqual(test_tokens[i].token)
				expect_error_to_match(checked_tokens[i], /^First person pronouns/)
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
			const INPUT = [create_sentence(test_tokens)]
			const checked_tokens = apply_rules(INPUT, PRONOUN_RULES).flatMap(flatten_sentence)

			expect(checked_tokens[0].token).toEqual(test_tokens[0].token)
			expect_error_to_match(checked_tokens[0], /^Second person pronouns/)
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
			const INPUT = [create_sentence(test_tokens)]
			const checked_tokens = apply_rules(INPUT, PRONOUN_RULES).flatMap(flatten_sentence)

			expect(checked_tokens[0].token).toEqual(test_tokens[0].token)
			expect_error_to_match(checked_tokens[0], /^Third person pronouns/)
		})
	})

	test('invalid: invalid pronoun used with referent', () => {
		const test_tokens = [create_sentence([
			create_pronoun_token('her', 'Mary'),
			create_pronoun_token('token', 'Mary'),
		])]
		const checked_tokens = apply_rules(test_tokens, PRONOUN_RULES).flatMap(flatten_sentence)

		const test_clause_tokens = test_tokens[0].clause.sub_tokens
		expect(checked_tokens[0].token).toEqual(test_clause_tokens[0].token)
		expect_error_to_match(checked_tokens[0].pronoun, /^Third person pronouns/)
		expect(checked_tokens[1].token).toEqual(test_clause_tokens[1].token)
		expect_error_to_match(checked_tokens[1].pronoun, /^Unrecognized pronoun/)
	})

	test('invalid: catches mine, yours, ours, and each-other', () => {
		const test_tokens = [create_sentence(create_tokens(['mine', 'yours', 'ours', 'each-other']))]
		const checked_tokens = apply_rules(test_tokens, PRONOUN_RULES).flatMap(flatten_sentence)

		const test_clause_tokens = test_tokens[0].clause.sub_tokens

		expect(checked_tokens[0].token).toEqual(test_clause_tokens[0].token)
		expect_error_to_match(checked_tokens[0], /^"mine" should be/)
		expect(checked_tokens[1].token).toEqual(test_clause_tokens[1].token)
		expect_error_to_match(checked_tokens[1], /^"yours" should be/)
		expect(checked_tokens[2].token).toEqual(test_clause_tokens[2].token)
		expect_error_to_match(checked_tokens[2], /^"ours" should be/)
		expect(checked_tokens[3].token).toEqual(test_clause_tokens[3].token)
		expect_error_to_match(checked_tokens[3], /^"each-other" requires/)
	})
})