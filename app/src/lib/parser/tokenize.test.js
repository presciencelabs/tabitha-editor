import { DEFAULT_TOKEN_VALUES, TOKEN_TYPE } from '$lib/token'
import { CLAUSE_NOTATIONS } from './clause_notations'
import { FUNCTION_WORDS } from './function_words'
import {tokenize_input} from './tokenize'
import {describe, expect, test} from 'vitest'

/**
 * 
 * @param {string} token 
 * @param {TokenType} type 
 * @returns 
 */
function simple_token(token, type) {
	return {
		...DEFAULT_TOKEN_VALUES,
		token,
		type,
	}
}

/**
 * 
 * @param {string} token 
 * @param {string} message 
 * @returns 
 */
function error_token(token, message) {
	return {
		...DEFAULT_TOKEN_VALUES,
		token,
		type: TOKEN_TYPE.ERROR,
		message,
	}
}

/**
 * 
 * @param {string} token 
 * @param {string?} lookup_term 
 * @returns 
 */
function word_token(token, lookup_term=null) {
	return {
		...DEFAULT_TOKEN_VALUES,
		token,
		type: TOKEN_TYPE.WORD,
		lookup_term: lookup_term || token,
	}
}

/**
 * 
 * @param {string} token 
 * @param {string?} lookup_left
 * @param {string?} lookup_right
 * @returns 
 */
function pairing_token(token, lookup_left=null, lookup_right=null) {
	let [left, right] = token.split('/')
	return {
		...DEFAULT_TOKEN_VALUES,
		token,
		type: TOKEN_TYPE.PAIRING,
		pairing_left: word_token(left, lookup_left),
		pairing_right: word_token(right, lookup_right),
	}
}

describe('tokenize_input', () => {
	test("'' should return an empty array", () => {
		const INPUT = ''

		/** @type {any[]} */
		const EXPECTED_OUTPUT = []

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	test("any whitespace should split tokens", () => {
		const INPUT = `a b    c
		d	e		  f
		   
		g`

		const EXPECTED_OUTPUT = [
			simple_token('a', TOKEN_TYPE.FUNCTION_WORD),
			word_token('b'),
			word_token('c'),
			word_token('d'),
			word_token('e'),
			word_token('f'),
			word_token('g'),
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	test('valid words', () => {
		const INPUT = "token tokens token's token-A token's-A in-order-to Holy-Spirit's token123 123"
		
		const EXPECTED_OUTPUT = [
			word_token("token", "token"),
			word_token("tokens", "tokens"),
			word_token("token's", "token"),
			word_token("token-A", "token-A"),
			word_token("token's-A", "token-A"),
			word_token("in-order-to", "in-order-to"),
			word_token("Holy-Spirit's", "Holy-Spirit"),
			word_token("token123", "token123"),
			word_token("123", "123"),
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	test('valid words with decimal', () => {
		const INPUT = "2.5 .5 .1. 3.88]"
		
		const EXPECTED_OUTPUT = [
			word_token('2.5', '2.5'),
			word_token('.5', '.5'),
			word_token('.1', '.1'),
			simple_token('.', TOKEN_TYPE.PUNCTUATION),
			word_token('3.88', '3.88'),
			simple_token(']', TOKEN_TYPE.PUNCTUATION),
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	test('invalid words', () => {
		const INPUT = ".token ,token token["
		
		const EXPECTED_OUTPUT = [
			error_token('.token', '. must be followed by a space or punctuation'),
			error_token(',token', ', must be followed by a space or punctuation'),
			error_token('token[', 'Must have a space between token and ['),
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	test('valid pronoun referents', () => {
		const INPUT = "you(Paul) abc(test) your(Paul's) your(son-C) your(son's-C) your(sons'-C)] you(Paul)."
		
		const EXPECTED_OUTPUT = [
			word_token("you(Paul)", "Paul"),
			word_token("abc(test)", "test"),
			word_token("your(Paul's)", "Paul"),
			word_token("your(son-C)", "son-C"),
			word_token("your(son's-C)", "son-C"),
			word_token("your(sons'-C)", "sons-C"),
			simple_token(']', TOKEN_TYPE.PUNCTUATION),
			word_token("you(Paul)", "Paul"),
			simple_token('.', TOKEN_TYPE.PUNCTUATION),
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	test('invalid pronoun referents', () => {
		const INPUT = "you(Paul youPaul) you(Paul)[ you(Paul)_."
		
		const EXPECTED_OUTPUT = [
			error_token("you(Paul", 'Missing a closing parenthesis'),
			error_token("youPaul)", 'Missing an opening parenthesis'),
			error_token("you(Paul)[", 'Must have a space between you(Paul) and ['),
			error_token("you(Paul)_", 'you(Paul) must be followed by a space or punctuation'),
			simple_token('.', TOKEN_TYPE.PUNCTUATION),
		]
		
		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	test('valid underscore notation', () => {
		const INPUT = "_note _note. _note] [_note _note[ __implicit"
		
		const EXPECTED_OUTPUT = [
			simple_token('_note', TOKEN_TYPE.NOTE),
			simple_token('_note', TOKEN_TYPE.NOTE),
			simple_token('.', TOKEN_TYPE.PUNCTUATION),
			simple_token('_note', TOKEN_TYPE.NOTE),
			simple_token(']', TOKEN_TYPE.PUNCTUATION),
			simple_token('[', TOKEN_TYPE.PUNCTUATION),
			simple_token('_note', TOKEN_TYPE.NOTE),
			simple_token('_note', TOKEN_TYPE.NOTE),
			simple_token('[', TOKEN_TYPE.PUNCTUATION),
			simple_token('__implicit', TOKEN_TYPE.NOTE), 	// double underscore is fine
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	test('invalid underscore notation', () => {
		const INPUT = "token_note token_ ._note ]_note"
		
		const EXPECTED_OUTPUT = [
			error_token('token_note', 'Notes notation should have a space before the underscore, e.g., ⎕_implicit'),
			error_token('token_', 'token must be followed by a space or punctuation'),
			error_token('._note', 'Notes notation should have a space before the underscore, e.g., ⎕_implicit'),
			error_token(']_note', 'Notes notation should have a space before the underscore, e.g., ⎕_implicit'),
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	test('valid clause notation', () => {
		const INPUT = "(imp) (implicit-situational) [(imp)"
		
		const EXPECTED_OUTPUT = [
			simple_token('(imp)', TOKEN_TYPE.NOTE),
			simple_token('(implicit-situational)', TOKEN_TYPE.NOTE),
			simple_token('[', TOKEN_TYPE.PUNCTUATION),
			simple_token('(imp)', TOKEN_TYPE.NOTE),
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	describe('all valid clause notations', () => {
		// prettier-ignore
		test.each(CLAUSE_NOTATIONS.map(notation => ([[notation]])))
			('%s', test_text => {
			const EXPECTED_OUTPUT = [
				simple_token(test_text[0], TOKEN_TYPE.NOTE)
			]

			expect(tokenize_input(test_text[0])).toEqual(EXPECTED_OUTPUT)
		})
	})

	test('invalid clause notation', () => {
		const INPUT = "(imp imp) token(imp) (imp)token (implicit_situational) (imperative) (Paul's) (test )"
		
		const EXPECTED_OUTPUT = [
			error_token('(imp', 'Missing a closing parenthesis'),
			error_token('imp)', 'Missing an opening parenthesis'),
			word_token('token(imp)', 'imp'),		// tokenizing at this time does not differentiate from a pronoun referent
			error_token('(imp)token', 'Must include a space after a clause notation'),
			error_token('(implicit_situational)', 'This clause notation is not recognized'),
			error_token('(imperative)', 'This clause notation is not recognized'),
			error_token("(Paul's)", 'This clause notation is not recognized'),
			error_token('(test', 'Missing a closing parenthesis'),
			error_token(')', 'Missing an opening parenthesis'),
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	describe('all valid function words lowercase', () => {
		// prettier-ignore
		test.each(Array.from(FUNCTION_WORDS).map(word => ([[word]])))
			('%s', test_text => {
			const EXPECTED_OUTPUT = [
				simple_token(test_text[0], TOKEN_TYPE.FUNCTION_WORD)
			]

			expect(tokenize_input(test_text[0])).toEqual(EXPECTED_OUTPUT)
		})
	})

	describe('all valid function words uppercase', () => {
		// prettier-ignore
		test.each(Array.from(FUNCTION_WORDS).map(word => ([[word.toUpperCase()]])))
			('%s', test_text => {
			const EXPECTED_OUTPUT = [
				simple_token(test_text[0], TOKEN_TYPE.FUNCTION_WORD)
			]

			expect(tokenize_input(test_text[0])).toEqual(EXPECTED_OUTPUT)
		})
	})

	test('valid opening brackets', () => {
		const INPUT = '[[ [" "[ [token [. [? [] [[token]]'
		
		const EXPECTED_OUTPUT = [
			simple_token('[', TOKEN_TYPE.PUNCTUATION),
			simple_token('[', TOKEN_TYPE.PUNCTUATION),
			simple_token('[', TOKEN_TYPE.PUNCTUATION),
			simple_token('"', TOKEN_TYPE.PUNCTUATION),
			simple_token('"', TOKEN_TYPE.PUNCTUATION),
			simple_token('[', TOKEN_TYPE.PUNCTUATION),
			simple_token('[', TOKEN_TYPE.PUNCTUATION),
			word_token('token'),
			simple_token('[', TOKEN_TYPE.PUNCTUATION),
			simple_token('.', TOKEN_TYPE.PUNCTUATION),
			simple_token('[', TOKEN_TYPE.PUNCTUATION),
			simple_token('?', TOKEN_TYPE.PUNCTUATION),
			simple_token('[', TOKEN_TYPE.PUNCTUATION),
			simple_token(']', TOKEN_TYPE.PUNCTUATION),
			simple_token('[', TOKEN_TYPE.PUNCTUATION),
			simple_token('[', TOKEN_TYPE.PUNCTUATION),
			word_token('token'),
			simple_token(']', TOKEN_TYPE.PUNCTUATION),
			simple_token(']', TOKEN_TYPE.PUNCTUATION),
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	test('invalid opening brackets', () => {
		const INPUT = ".[ ,[ ?[ ][ token["
		
		const EXPECTED_OUTPUT = [
			error_token('.[', 'Must have a space between . and ['),
			error_token(',[', 'Must have a space between , and ['),
			error_token('?[', 'Must have a space between ? and ['),
			error_token('][', 'Must have a space between ] and ['),
			error_token('token[', 'Must have a space between token and ['),
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	test('valid punctuation', () => {
		const INPUT = '." ". ?"] token]". "], token]] token,'
		
		const EXPECTED_OUTPUT = [
			simple_token('.', TOKEN_TYPE.PUNCTUATION),
			simple_token('"', TOKEN_TYPE.PUNCTUATION),
			simple_token('"', TOKEN_TYPE.PUNCTUATION),
			simple_token('.', TOKEN_TYPE.PUNCTUATION),
			simple_token('?', TOKEN_TYPE.PUNCTUATION),
			simple_token('"', TOKEN_TYPE.PUNCTUATION),
			simple_token(']', TOKEN_TYPE.PUNCTUATION),
			word_token('token'),
			simple_token(']', TOKEN_TYPE.PUNCTUATION),
			simple_token('"', TOKEN_TYPE.PUNCTUATION),
			simple_token('.', TOKEN_TYPE.PUNCTUATION),
			simple_token('"', TOKEN_TYPE.PUNCTUATION),
			simple_token(']', TOKEN_TYPE.PUNCTUATION),
			simple_token(',', TOKEN_TYPE.PUNCTUATION),
			word_token('token'),
			simple_token(']', TOKEN_TYPE.PUNCTUATION),
			simple_token(']', TOKEN_TYPE.PUNCTUATION),
			word_token('token'),
			simple_token(',', TOKEN_TYPE.PUNCTUATION),
		]
		
		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	test('invalid single characters', () => {
		const INPUT = "( ) / * + ;"
		
		const EXPECTED_OUTPUT = [
			error_token('(', 'Missing a closing parenthesis'),
			error_token(')', 'Missing an opening parenthesis'),
			error_token('/', 'Pairings should have the form simple/complex, e.g., follower/disciple.'),
			error_token('*', 'Unrecognized character'),
			error_token('+', 'Unrecognized character'),
			error_token(';', 'Unrecognized character'),
		]

		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	test('valid pairing', () => {
		const INPUT = "simple/complex simple's/complex's simples'/complexs' simples'-A/complexs' simple-A/complex-B. [simple/complex]"
		
		const EXPECTED_OUTPUT = [
			pairing_token("simple/complex"),
			pairing_token("simple's/complex's", "simple", "complex"),
			pairing_token("simples'/complexs'", "simples", "complexs"),
			pairing_token("simples'-A/complexs'", "simples-A", "complexs"),
			pairing_token("simple-A/complex-B", "simple-A", "complex-B"),
			simple_token('.', TOKEN_TYPE.PUNCTUATION),
			simple_token('[', TOKEN_TYPE.PUNCTUATION),
			pairing_token("simple/complex", "simple", "complex"),
			simple_token(']', TOKEN_TYPE.PUNCTUATION),
		]
		
		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})

	test('invalid pairing', () => {
		const INPUT = "/complex simple/ / simple//complex simple/.complex simple./complex"
		
		const EXPECTED_OUTPUT = [
			error_token('/complex', 'Pairings should have the form simple/complex, e.g., follower/disciple.'),
			error_token('simple/', 'Pairings should have the form simple/complex, e.g., follower/disciple.'),
			error_token('/', 'Pairings should have the form simple/complex, e.g., follower/disciple.'),
			error_token('simple//complex', 'Pairings should have the form simple/complex, e.g., follower/disciple.'),
			error_token('simple/', 'Pairings should have the form simple/complex, e.g., follower/disciple.'),
			error_token('.complex', '. must be followed by a space or punctuation'),
			word_token('simple'),
			error_token('./complex', '. must be followed by a space or punctuation'),
		]
		
		expect(tokenize_input(INPUT)).toEqual(EXPECTED_OUTPUT)
	})
})
