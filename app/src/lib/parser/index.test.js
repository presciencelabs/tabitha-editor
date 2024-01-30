import {parse} from '.'
import {describe, expect, test} from 'vitest'
import { DEFAULT_TOKEN_VALUES, TOKEN_TYPE } from '$lib/token'

/**
 * 
 * @param {string} token 
 * @param {string?} lookup_term 
 * @returns 
 */
export function word_token(token, lookup_term=null) {
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
export function pairing_token(token, lookup_left=null, lookup_right=null) {
	let [left, right] = token.split('/')
	return {
		...DEFAULT_TOKEN_VALUES,
		token,
		type: TOKEN_TYPE.PAIRING,
		pairing_left: word_token(left, lookup_left),
		pairing_right: word_token(right, lookup_right),
	}
}

describe('parse', () => {
	describe('no problems', () => {
		test('empty string', () => {
			expect(parse('')).toEqual([])
		})

		test('whitespace', () => {
			expect(parse(' ')).toEqual([])
		})

		test('token', () => {
			expect(parse('token')).toEqual([
				word_token('token')
			])
		})

		test('token1 token2', () => {
			expect(parse('token1 token2')).toEqual([
				word_token('token1'),
				word_token('token2')
			])
		})

		test('ok _notesNotation [fixedbracket you(Paul)]', () => {
			const results = parse('ok _notesNotation [fixedbracket you(Paul)]')

			expect(results).length(6)
			expect(results[0].token).toBe('ok')
			expect(results[0].type).toBe(TOKEN_TYPE.WORD)
			expect(results[0].message).toBe('')
			expect(results[1].token).toBe('_notesNotation')
			expect(results[1].type).toBe(TOKEN_TYPE.NOTE)
			expect(results[1].message).toBe('')
			expect(results[2].token).toBe('[')
			expect(results[2].type).toBe(TOKEN_TYPE.PUNCTUATION)
			expect(results[2].message).toBe('')
			expect(results[3].token).toBe('fixedbracket')
			expect(results[3].type).toBe(TOKEN_TYPE.WORD)
			expect(results[3].message).toBe('')
			expect(results[4].token).toBe('you(Paul)')
			expect(results[4].type).toBe(TOKEN_TYPE.WORD)
			expect(results[4].message).toBe('')
			expect(results[5].token).toBe(']')
			expect(results[5].type).toBe(TOKEN_TYPE.PUNCTUATION)
			expect(results[5].message).toBe('')
		})

		test('[Paul explained [the Christ needed to become alive again]].', () => {
			const results = parse('[Paul explained [the Christ needed to become alive again]].')

			expect(results).length(14)
			expect(results[0].token).toBe('[')
			expect(results[0].message).toBe('')
			expect(results[1].token).toBe('Paul')
			expect(results[1].message).toBe('')
			expect(results[2].token).toBe('explained')
			expect(results[2].message).toBe('')
			expect(results[3].token).toBe('[')
			expect(results[3].message).toBe('')
			expect(results[4].token).toBe('the')
			expect(results[4].message).toBe('')
			expect(results[5].token).toBe('Christ')
			expect(results[5].message).toBe('')
			expect(results[6].token).toBe('needed')
			expect(results[6].message).toBe('')
			expect(results[7].token).toBe('to')
			expect(results[7].message).toBe('')
			expect(results[8].token).toBe('become')
			expect(results[8].message).toBe('')
			expect(results[9].token).toBe('alive')
			expect(results[9].message).toBe('')
			expect(results[10].token).toBe('again')
			expect(results[10].message).toBe('')
			expect(results[11].token).toBe(']')
			expect(results[11].message).toBe('')
			expect(results[12].token).toBe(']')
			expect(results[12].message).toBe('')
			expect(results[13].token).toBe('.')
			expect(results[13].message).toBe('')
		})

		test('you(people) are being stupid/foolish."', () => {
			const results = parse('you(people) are being stupid/foolish."')

			expect(results).length(6)
			expect(results[0].token).toBe('you(people)')
			expect(results[0].type).toBe(TOKEN_TYPE.WORD)
			expect(results[0].message).toBe('')
			expect(results[1].token).toBe('are')
			expect(results[1].type).toBe(TOKEN_TYPE.WORD)
			expect(results[1].message).toBe('')
			expect(results[2].token).toBe('being')
			expect(results[2].type).toBe(TOKEN_TYPE.WORD)
			expect(results[2].message).toBe('')
			expect(results[3].token).toBe('stupid/foolish')
			expect(results[3].type).toBe(TOKEN_TYPE.PAIRING)
			expect(results[3].message).toBe('')
			expect(results[4].token).toBe('.')
			expect(results[4].type).toBe(TOKEN_TYPE.PUNCTUATION)
			expect(results[4].message).toBe('')
			expect(results[5].token).toBe('"')
			expect(results[5].type).toBe(TOKEN_TYPE.PUNCTUATION)
			expect(results[5].message).toBe('')
		})
	})

	describe('problems detected', () => {
		test('bad_notesNotation[badbracket you', () => {
			const results = parse('bad_notesNotation[badbracket you')

			expect(results).length(3)
			expect(results[0].token).toBe('bad_notesNotation[badbracket')
			expect(results[0].message).toMatch(/^Notes notation/)
			expect(results[1].token).toBe('you')
			expect(results[1].message).toMatch(/^Second person pronouns/)
			expect(results[2].token).toBe(']')
			expect(results[2].message).toMatch(/^Missing a closing bracket/)
		})

		test('ok _notesNotation text[badbracket you', () => {
			const results = parse('ok _notesNotation text[badbracket you')

			expect(results).length(6)
			expect(results[0].token).toBe('ok')
			expect(results[0].message).toBe('')
			expect(results[1].token).toBe('_notesNotation')
			expect(results[1].message).toBe('')
			expect(results[2].token).toBe('text[')
			expect(results[2].message).toMatch(/^Must have a space/)
			expect(results[3].token).toBe('badbracket')
			expect(results[3].message).toBe('')
			expect(results[4].token).toBe('you')
			expect(results[4].message).toMatch(/^Second person pronouns/)
			expect(results[5].token).toBe(']')
			expect(results[5].message).toMatch(/^Missing a closing bracket/)
		})

		test('ok _notesNotation [fixedbracket you', () => {
			const results = parse('ok _notesNotation [fixedbracket you')

			expect(results).length(6)
			expect(results[0].token).toBe('ok')
			expect(results[0].message).toBe('')
			expect(results[1].token).toBe('_notesNotation')
			expect(results[1].message).toBe('')
			expect(results[2].token).toBe('[')
			expect(results[2].message).toBe('')
			expect(results[3].token).toBe('fixedbracket')
			expect(results[3].message).toBe('')
			expect(results[4].token).toBe('you')
			expect(results[4].message).toMatch(/^Second person pronouns/)
			expect(results[5].token).toBe(']')
			expect(results[5].message).toMatch(/^Missing a closing bracket/)
		})

		test('ok _notesNotation [fixedbracket you(Paul', () => {
			const results = parse('ok _notesNotation [fixedbracket you(Paul')

			expect(results).length(6)
			expect(results[0].token).toBe('ok')
			expect(results[0].message).toBe('')
			expect(results[1].token).toBe('_notesNotation')
			expect(results[1].message).toBe('')
			expect(results[2].token).toBe('[')
			expect(results[2].message).toBe('')
			expect(results[3].token).toBe('fixedbracket')
			expect(results[3].message).toBe('')
			expect(results[4].token).toBe('you(Paul')
			expect(results[4].message).toMatch(/^Missing a closing parenthesis/)
			expect(results[5].token).toBe(']')
			expect(results[5].message).toMatch(/^Missing a closing bracket/)
		})

		test('ok _notesNotation [fixedbracket you(Paul)', () => {
			const results = parse('ok _notesNotation [fixedbracket you(Paul)')

			expect(results).length(6)
			expect(results[0].token).toBe('ok')
			expect(results[0].message).toBe('')
			expect(results[1].token).toBe('_notesNotation')
			expect(results[1].message).toBe('')
			expect(results[2].token).toBe('[')
			expect(results[2].message).toBe('')
			expect(results[3].token).toBe('fixedbracket')
			expect(results[3].message).toBe('')
			expect(results[4].token).toBe('you(Paul)')
			expect(results[4].message).toBe('')
			expect(results[5].token).toBe(']')
			expect(results[5].message).toMatch(/^Missing a closing bracket/)
		})

		test('Paul explained [the Christ needed to become alive again]].', () => {
			const results = parse('Paul explained [the Christ needed to become alive again]].')

			expect(results).length(14)
			expect(results[0].token).toBe('[')
			expect(results[0].message).toMatch(/^Missing an opening bracket/)
			expect(results[1].token).toBe('Paul')
			expect(results[1].message).toBe('')
			expect(results[2].token).toBe('explained')
			expect(results[2].message).toBe('')
			expect(results[3].token).toBe('[')
			expect(results[3].message).toBe('')
			expect(results[4].token).toBe('the')
			expect(results[4].message).toBe('')
			expect(results[5].token).toBe('Christ')
			expect(results[5].message).toBe('')
			expect(results[6].token).toBe('needed')
			expect(results[6].message).toBe('')
			expect(results[7].token).toBe('to')
			expect(results[7].message).toBe('')
			expect(results[8].token).toBe('become')
			expect(results[8].message).toBe('')
			expect(results[9].token).toBe('alive')
			expect(results[9].message).toBe('')
			expect(results[10].token).toBe('again')
			expect(results[10].message).toBe('')
			expect(results[11].token).toBe(']')
			expect(results[11].message).toBe('')
			expect(results[12].token).toBe(']')
			expect(results[12].message).toBe('')
			expect(results[13].token).toBe('.')
			expect(results[13].message).toBe('')
		})
	})
})
