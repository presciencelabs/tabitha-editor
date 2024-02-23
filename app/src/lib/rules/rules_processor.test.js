import {TOKEN_TYPE, create_clause_token, create_token, flatten_sentence} from '$lib/parser/token'
import {describe, expect, test} from 'vitest'
import {parse_checker_rule, parse_transform_rule} from './rules_parser'
import {apply_checker_rules, apply_transform_rules} from './rules_processor'

/**
 * 
 * @param {Token[]} tokens 
 * @returns {Sentence}
 */
function create_sentence(tokens) {
	return { clause: create_clause_token(tokens) }
}

describe('transform rules', () => {
	test('trigger does not match', () => {
		const transform_rules = [
			{
				'trigger': { 'token': 'token' },
				'context': { 'followedby': 'all' },
				'transform': { 'concept': 'concept-A' },
			},
		].map(parse_transform_rule)

		const input_tokens = [
			create_sentence([
				create_token('text', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'text'}),
				create_token('other', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'other'}),
			]),
		]

		const results = apply_transform_rules(input_tokens, transform_rules)

		expect(results).toEqual(input_tokens)
	})

	test('triggered but context does not match', () => {
		const transform_rules = [
			{
				'trigger': { 'token': 'token' },
				'context': { 'followedby': { 'token': 'other' } },
				'transform': { 'concept': 'concept-A' },
			},
		].map(parse_transform_rule)

		const input_tokens = [
			create_sentence([
				create_token('token', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'token'}),
				create_token('text', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'text'}),
			]),
		]

		const results = apply_transform_rules(input_tokens, transform_rules)

		expect(results).toEqual(input_tokens)
	})

	test('triggered and transformed', () => {
		const transform_rules = [
			{
				'trigger': { 'token': 'peanut' },
				'context': { 'precededby': { 'token': 'a' } },
				'transform': { 'concept': 'concept-A' },
			},
		].map(parse_transform_rule)

		const input_tokens = [
			create_sentence([
				create_token('John\'s', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'John'}),
				create_token('peanut', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'peanut'}),
				create_token('was', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'was'}),
				create_token('a', TOKEN_TYPE.FUNCTION_WORD),
				create_token('peanut', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'peanut'}),
				create_token('.', TOKEN_TYPE.PUNCTUATION),
			]),
		]

		const results = apply_transform_rules(input_tokens, transform_rules).flatMap(flatten_sentence)

		expect(results.length).toBe(6)
		expect(results[1].lookup_term).toBe('peanut')
		expect(results[4].lookup_term).toBe('concept-A')
	})

	test('triggered within a subordinate clauses', () => {
		const transform_rules = [
			{
				'trigger': { 'token': 'token' },
				'context': { 'followedby': { 'token': 'context' } },
				'transform': { 'concept': 'concept-A' },
			},
		].map(parse_transform_rule)

		const input_tokens = [
			create_sentence([
				create_clause_token([
					create_token('token', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'token'}),
					create_token('context', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'context'}),
				]),
			]),
		]

		const results = apply_transform_rules(input_tokens, transform_rules).flatMap(flatten_sentence)

		expect(results[0].lookup_term).toBe('concept-A')
	})

	test('multiple transforms for one token', () => {
		const transform_rules = [
			{
				'trigger': { 'token': 'the' },
				'context': { 'followedby': 'all' },
				'transform': { 'concept': 'the-A' },
			},
			{
				'trigger': { 'type': TOKEN_TYPE.FUNCTION_WORD },
				'context': { 'followedby': 'all' },
				'transform': { 'concept': 'the-B' },
			},
		].map(parse_transform_rule)

		const tokens = [
			create_sentence([
				create_token('John', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'John'}),
				create_token('saw', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'saw'}),
				create_token('the', TOKEN_TYPE.FUNCTION_WORD),
				create_token('cat', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'cat'}),
				create_token('.', TOKEN_TYPE.PUNCTUATION),
			]),
		]

		const results = apply_transform_rules(tokens, transform_rules).flatMap(flatten_sentence)

		expect(results[2].lookup_term).toBe('the-B')
	})

	test('not triggered across sentences', () => {
		const transform_rules = [
			{
				'trigger': { 'token': 'token' },
				'context': { 'followedby': { 'token': 'other', 'skip': 'all'  } },
				'transform': { 'concept': 'concept-A' },
			},
		].map(parse_transform_rule)

		const input_tokens = [
			create_sentence([
				create_token('token', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'token'}),
			]),
			create_sentence([
				create_token('context', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'context'}),
			]),
		]

		const results = apply_transform_rules(input_tokens, transform_rules)

		expect(results).toEqual(input_tokens)
	})

	test('not triggered when context is in subordinate clauses', () => {
		const transform_rules = [
			{
				'trigger': { 'token': 'token' },
				'context': { 'followedby': { 'token': 'context', 'skip': 'all' } },
				'transform': { 'concept': 'concept-A' },
			},
		].map(parse_transform_rule)

		const input_tokens = [
			create_sentence([
				create_token('token', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'token'}),
				create_clause_token([
					create_token('context', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'context'}),
				]),
			]),
		]

		const results = apply_transform_rules(input_tokens, transform_rules)

		expect(results).toEqual(input_tokens)
	})
})

describe('checker rules', () => {
	test('trigger does not match', () => {
		const rules = [
			{
				'trigger': { 'token': 'token' },
				'context': { 'followedby': { 'token': 'context' }},
				'require': {
					'followedby': 'add',
					'message': 'message',
				},
			},
		].map(parse_checker_rule)

		const input_tokens = [
			create_sentence([
				create_token('not_token', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'not_token'}),
			]),
		]

		const output_tokens = apply_checker_rules(input_tokens, rules)

		expect(output_tokens).toEqual(input_tokens)
	})
	test('triggered but context does not match', () => {
		const rules = [
			{
				'trigger': { 'token': 'token' },
				'context': { 'followedby': { 'token': 'context' }},
				'require': {
					'followedby': 'add',
					'message': 'message',
				},
			},
		].map(parse_checker_rule)

		const input_tokens = [
			create_sentence([
				create_token('token', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'token'}),
			]),
		]

		const output_tokens = apply_checker_rules(input_tokens, rules)

		expect(output_tokens).toEqual(input_tokens)
	})
	test('triggered with require followedby', () => {
		const rules = [
			{
				'trigger': { 'token': 'token' },
				'context': { 'followedby': { 'token': 'context' }},
				'require': {
					'followedby': 'add',
					'message': 'message',
				},
			},
		].map(parse_checker_rule)

		const input_tokens = [
			create_sentence([
				create_token('token', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'token'}),
				create_token('context', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'context'}),
			]),
		]

		const output_tokens = apply_checker_rules(input_tokens, rules).flatMap(flatten_sentence)

		expect(output_tokens.length).toBe(3)
		expect(output_tokens[0].message).toBe('')
		expect(output_tokens[1].token).toBe('add')
		expect(output_tokens[1].message).toBe('message')
		expect(output_tokens[2].message).toBe('')
	})
	test('triggered with require precededby', () => {
		const rules = [
			{
				'trigger': { 'token': 'token' },
				'context': { 'followedby': { 'token': 'context' }},
				'require': {
					'precededby': 'add',
					'message': 'message',
				},
			},
		].map(parse_checker_rule)

		const input_tokens = [
			create_sentence([
				create_token('token', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'token'}),
				create_token('context', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'context'}),
			]),
		]

		const output_tokens = apply_checker_rules(input_tokens, rules).flatMap(flatten_sentence)

		expect(output_tokens.length).toBe(3)
		expect(output_tokens[0].token).toBe('add')
		expect(output_tokens[0].message).toBe('message')
		expect(output_tokens[1].message).toBe('')
		expect(output_tokens[2].message).toBe('')
	})
	test('triggered with multiple precededby', () => {
		const rules = [
			{
				'trigger': { 'token': 'token' },
				'context': { 'followedby': { 'token': 'context' }},
				'require': {
					'precededby': 'add1',
					'message': 'message1',
				},
			},
			{
				'trigger': { 'token': 'token' },
				'context': { 'followedby': { 'token': 'context' }},
				'require': {
					'precededby': 'add2',
					'message': 'message2',
				},
			},
		].map(parse_checker_rule)

		const input_tokens = [
			create_sentence([
				create_token('token', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'token'}),
				create_token('context', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'context'}),
			]),
		]

		const output_tokens = apply_checker_rules(input_tokens, rules).flatMap(flatten_sentence)

		expect(output_tokens.length).toBe(4)
		expect(output_tokens[0].token).toBe('add1')
		expect(output_tokens[0].message).toBe('message1')
		expect(output_tokens[1].token).toBe('add2')
		expect(output_tokens[1].message).toBe('message2')
		expect(output_tokens[2].message).toBe('')
		expect(output_tokens[3].message).toBe('')
	})
	test('triggered with message on trigger', () => {
		const rules = [
			{
				'trigger': { 'token': 'token' },
				'context': { 'followedby': { 'token': 'context' }},
				'require': { 'message': 'message' },
			},
		].map(parse_checker_rule)

		const input_tokens = [
			create_sentence([
				create_token('token', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'token'}),
				create_token('context', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'context'}),
			]),
		]

		const output_tokens = apply_checker_rules(input_tokens, rules).flatMap(flatten_sentence)

		expect(output_tokens.length).toBe(2)
		expect(output_tokens[0].token).toBe('token')
		expect(output_tokens[0].message).toBe('message')
		expect(output_tokens[1].message).toBe('')
	})
	test('not triggered across sentences', () => {
		const rules = [
			{
				'trigger': { 'token': 'token' },
				'context': { 'followedby': { 'token': 'context', 'skip': 'all' }},
				'require': {
					'followedby': 'add',
					'message': 'message',
				},
			},
		].map(parse_checker_rule)

		const input_tokens = [
			create_sentence([
				create_token('token', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'token'}),
			]),
			create_sentence([
				create_token('context', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'context'}),
			]),
		]

		const output_tokens = apply_checker_rules(input_tokens, rules)

		expect(output_tokens).toEqual(input_tokens)
	})
	test('context not triggered from within subordinate clauses', () => {
		const rules = [
			{
				'trigger': { 'token': 'token' },
				'context': { 'followedby': { 'token': 'context', 'skip': 'all' }},
				'require': {
					'followedby': 'add',
					'message': 'message',
				},
			},
		].map(parse_checker_rule)

		const input_tokens = [
			create_sentence([
				create_token('token', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'token'}),
				create_clause_token([
					create_token('context', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'context'}),
				]),
			]),
		]

		const output_tokens = apply_checker_rules(input_tokens, rules)

		expect(output_tokens).toEqual(input_tokens)
	})

	test('triggered within a subordinate clauses', () => {
		const rules = [
			{
				'trigger': { 'token': 'token' },
				'context': { 'followedby': { 'token': 'context' } },
				'require': {
					'followedby': 'add',
					'message': 'message',
				},
			},
		].map(parse_checker_rule)

		const input_tokens = [
			create_sentence([
				create_clause_token([
					create_token('token', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'token'}),
					create_token('context', TOKEN_TYPE.LOOKUP_WORD, {lookup_term: 'context'}),
				]),
			]),
		]

		const results = apply_checker_rules(input_tokens, rules).flatMap(flatten_sentence)

		expect(results.length).toBe(3)
		expect(results[1].token).toBe('add')
		expect(results[1].message).toBe('message')
	})
})