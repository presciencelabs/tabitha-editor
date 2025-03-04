import { TOKEN_TYPE, create_clause_token, create_lookup_result, create_token, flatten_sentence } from '../token'
import { ERRORS } from '../parser/error_messages'
import { apply_rules } from './rules_processor'
import { describe, expect, test } from 'vitest'
import { PART_OF_SPEECH_RULES } from './part_of_speech_rules'
import { expect_error } from '$lib/test_helps'

/**
 * 
 * @param {Token} left 
 * @param {Token} right 
 * @returns {Token}
 */
function create_pairing_token(left, right) {
	left.complex_pairing = right
	return left
}

/**
 * 
 * @param {string} token 
 * @param {Object} [data={}] 
 * @param {LookupResult[]} [data.lookup_results=[]] 
 * @returns {Token}
 */
function create_lookup_token(token, { lookup_results=[] }={}) {
	return create_token(token, TOKEN_TYPE.LOOKUP_WORD, { lookup_term: token, lookup_results })
}

/**
 * 
 * @param {Token[]} tokens 
 * @returns {Sentence}
 */
function create_sentence(tokens) {
	return { clause: create_clause_token(tokens, { 'clause_type': 'main_clause' }) }
}

/**
 * 
 * @param {string} stem
 * @param {Object} [data={}] 
 * @param {string} [data.sense='A'] 
 * @param {string} [data.part_of_speech='Noun'] 
 * @param {number} [data.level=1] 
 * @param {number} [data.ontology_id=1] 
 * @returns {LookupResult}
 */
function lookup_result(stem, { sense='A', part_of_speech='Noun', level=1, ontology_id=1 }={}) {
	return create_lookup_result({ stem, part_of_speech }, { sense, level, ontology_id })
}

describe('pairing part_of_speech disambiguation', () => {
	test('both words fully match part_of_speech', () => {
		const test_tokens = [create_sentence([
			create_token('A', TOKEN_TYPE.FUNCTION_WORD),
			create_pairing_token(
				create_lookup_token('first', { lookup_results: [lookup_result('first', { level: 1 })] }),
				create_lookup_token('second', { lookup_results: [lookup_result('second', { level: 2 })] }),
			),
			create_token('.', TOKEN_TYPE.PUNCTUATION),
		])]

		const checked_tokens = apply_rules(test_tokens, PART_OF_SPEECH_RULES)

		expect(checked_tokens).toEqual(test_tokens)
	})
	test('overlap with one part_of_speech', () => {
		const test_tokens = [create_sentence([
			create_token('A', TOKEN_TYPE.FUNCTION_WORD),
			create_pairing_token(
				create_lookup_token('first', { lookup_results: [
					lookup_result('first', { part_of_speech: 'Noun', level: 1 }),
					lookup_result('first', { part_of_speech: 'Verb', level: 1 }),
				] }),
				create_lookup_token('second', { lookup_results: [
					lookup_result('second', { part_of_speech: 'Verb', level: 2 }),
					lookup_result('second', { part_of_speech: 'Adjective', level: 2 }),
				] }),
			),
			create_token('.', TOKEN_TYPE.PUNCTUATION),
		])]

		const checked_tokens = apply_rules(test_tokens, PART_OF_SPEECH_RULES).flatMap(flatten_sentence)

		expect(checked_tokens[1].messages.length).toBe(0)
		expect(checked_tokens[1].lookup_results.length).toBe(1)
		expect(checked_tokens[1].lookup_results[0].part_of_speech).toBe('Verb')

		expect(checked_tokens[1].complex_pairing?.messages.length).toBe(0)
		expect(checked_tokens[1].complex_pairing?.lookup_results.length).toBe(1)
		expect(checked_tokens[1].complex_pairing?.lookup_results[0].part_of_speech).toBe('Verb')
	})
	test('overlap with two part_of_speech', () => {
		const test_tokens = [create_sentence([
			create_token('A', TOKEN_TYPE.FUNCTION_WORD),
			create_pairing_token(
				create_lookup_token('first', { lookup_results: [
					lookup_result('first', { part_of_speech: 'Noun', level: 1 }),
					lookup_result('first', { part_of_speech: 'Verb', level: 1 }),
				] }),
				create_lookup_token('second', { lookup_results: [
					lookup_result('second', { part_of_speech: 'Verb', level: 2 }),
					lookup_result('second', { part_of_speech: 'Noun', level: 2 }),
				] }),
			),
			create_token('.', TOKEN_TYPE.PUNCTUATION),
		])]

		const checked_tokens = apply_rules(test_tokens, PART_OF_SPEECH_RULES)

		expect(checked_tokens).toEqual(test_tokens)
	})
	test('overlap with no part_of_speech', () => {
		const test_tokens = [create_sentence([
			create_token('A', TOKEN_TYPE.FUNCTION_WORD),
			create_pairing_token(
				create_lookup_token('first', { lookup_results: [
					lookup_result('first', { part_of_speech: 'Noun', level: 1 }),
					lookup_result('first', { part_of_speech: 'Adverb', level: 1 }),
				] }),
				create_lookup_token('second', { lookup_results: [
					lookup_result('second', { part_of_speech: 'Adjective', level: 2 }),
					lookup_result('second', { part_of_speech: 'Adposition', level: 2 }),
				] }),
			),
			create_token('.', TOKEN_TYPE.PUNCTUATION),
		])]

		const checked_tokens = apply_rules(test_tokens, PART_OF_SPEECH_RULES).flatMap(flatten_sentence)

		expect_error(checked_tokens[1], ERRORS.PAIRING_DIFFERENT_PARTS_OF_SPEECH)
		expect(checked_tokens[1].lookup_results.length).toBe(2)

		expect(checked_tokens[1].complex_pairing?.messages.length).toBe(0)
		expect(checked_tokens[1].complex_pairing?.lookup_results.length).toBe(2)
	})
})

// TODO add tests for possessive and pronoun-based rules
