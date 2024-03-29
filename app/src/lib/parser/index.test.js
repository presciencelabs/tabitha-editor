import { parse_for_test } from '.'
import { describe, expect, test } from 'vitest'
import { TOKEN_TYPE } from './token'
import { ERRORS } from './error_messages'

describe('parse', () => {
	describe('no problems', () => {
		test('empty string', () => {
			expect(parse_for_test('')).toEqual([])
		})

		test('whitespace', () => {
			expect(parse_for_test(' ')).toEqual([])
		})

		test('Token.', () => {
			const results = parse_for_test('Token.')

			expect(results[0].token).toBe('Token')
			expect(results[0].type).toBe(TOKEN_TYPE.LOOKUP_WORD)
			expect(results[0].error_message).toBe('')
			expect(results[1].token).toBe('.')
			expect(results[1].type).toBe(TOKEN_TYPE.PUNCTUATION)
			expect(results[1].error_message).toBe('')
			expect(results).length(2)
		})

		test('Token1 token2.', () => {
			const results = parse_for_test('Token1 token2.')

			expect(results[0].token).toBe('Token1')
			expect(results[0].type).toBe(TOKEN_TYPE.LOOKUP_WORD)
			expect(results[0].error_message).toBe('')
			expect(results[1].token).toBe('token2')
			expect(results[1].type).toBe(TOKEN_TYPE.LOOKUP_WORD)
			expect(results[1].error_message).toBe('')
			expect(results[2].token).toBe('.')
			expect(results[2].type).toBe(TOKEN_TYPE.PUNCTUATION)
			expect(results[2].error_message).toBe('')
			expect(results).length(3)
		})

		test('Ok _notesNotation [fixedbracket you(Paul)].', () => {
			const results = parse_for_test('Ok _notesNotation [fixedbracket you(Paul)].')

			expect(results[0].token).toBe('Ok')
			expect(results[0].type).toBe(TOKEN_TYPE.LOOKUP_WORD)
			expect(results[0].error_message).toBe('')
			expect(results[1].token).toBe('_notesNotation')
			expect(results[1].type).toBe(TOKEN_TYPE.NOTE)
			expect(results[1].error_message).toBe('')
			expect(results[2].token).toBe('[')
			expect(results[2].type).toBe(TOKEN_TYPE.PUNCTUATION)
			expect(results[2].error_message).toBe('')
			expect(results[3].token).toBe('fixedbracket')
			expect(results[3].type).toBe(TOKEN_TYPE.LOOKUP_WORD)
			expect(results[3].error_message).toBe('')
			expect(results[4].token).toBe('Paul')
			expect(results[4].type).toBe(TOKEN_TYPE.LOOKUP_WORD)
			expect(results[4].error_message).toBe('')
			expect(results[4].pronoun?.token).toBe('you')
			expect(results[4].pronoun?.type).toBe(TOKEN_TYPE.FUNCTION_WORD)
			expect(results[4].pronoun?.error_message).toBe('')
			expect(results[5].token).toBe(']')
			expect(results[5].type).toBe(TOKEN_TYPE.PUNCTUATION)
			expect(results[5].error_message).toBe('')
			expect(results[6].token).toBe('.')
			expect(results[6].type).toBe(TOKEN_TYPE.PUNCTUATION)
			expect(results[6].error_message).toBe('')
			expect(results).length(7)
		})

		test('[Paul explained [the Christ needed to become alive again]].', () => {
			const results = parse_for_test('[Paul explained [the Christ needed to become alive again]].')

			expect(results[0].token).toBe('[')
			expect(results[0].error_message).toBe('')
			expect(results[1].token).toBe('Paul')
			expect(results[1].error_message).toBe('')
			expect(results[2].token).toBe('explained')
			expect(results[2].error_message).toBe('')
			expect(results[3].token).toBe('[')
			expect(results[3].error_message).toBe('')
			expect(results[4].token).toBe('the')
			expect(results[4].error_message).toBe('')
			expect(results[5].token).toBe('Christ')
			expect(results[5].error_message).toBe('')
			expect(results[6].token).toBe('needed')
			expect(results[6].error_message).toBe('')
			expect(results[7].token).toBe('to')
			expect(results[7].error_message).toBe('')
			expect(results[8].token).toBe('become')
			expect(results[8].error_message).toBe('')
			expect(results[9].token).toBe('alive')
			expect(results[9].error_message).toBe('')
			expect(results[10].token).toBe('again')
			expect(results[10].error_message).toBe('')
			expect(results[11].token).toBe(']')
			expect(results[11].error_message).toBe('')
			expect(results[12].token).toBe(']')
			expect(results[12].error_message).toBe('')
			expect(results[13].token).toBe('.')
			expect(results[13].error_message).toBe('')
			expect(results).length(14)
		})

		test('You(people) are being stupid/foolish."', () => {
			const results = parse_for_test('You(people) are being stupid/foolish."')

			expect(results[0].token).toBe('people')
			expect(results[0].type).toBe(TOKEN_TYPE.LOOKUP_WORD)
			expect(results[0].error_message).toBe('')
			expect(results[0].pronoun?.token).toBe('You')
			expect(results[0].pronoun?.type).toBe(TOKEN_TYPE.FUNCTION_WORD)
			expect(results[0].pronoun?.error_message).toBe('')
			expect(results[1].token).toBe('are')
			expect(results[1].type).toBe(TOKEN_TYPE.LOOKUP_WORD)
			expect(results[1].error_message).toBe('')
			expect(results[2].token).toBe('being')
			expect(results[2].type).toBe(TOKEN_TYPE.LOOKUP_WORD)
			expect(results[2].error_message).toBe('')
			expect(results[3].token).toBe('stupid')
			expect(results[3].type).toBe(TOKEN_TYPE.LOOKUP_WORD)
			expect(results[3].complex_pairing?.token).toBe('foolish')
			expect(results[3].error_message).toBe('')
			expect(results[4].token).toBe('.')
			expect(results[4].type).toBe(TOKEN_TYPE.PUNCTUATION)
			expect(results[4].error_message).toBe('')
			expect(results[5].token).toBe('"')
			expect(results[5].type).toBe(TOKEN_TYPE.PUNCTUATION)
			expect(results[5].error_message).toBe('')
			expect(results).length(6)
		})

		test('John said, ["What do you(person) want?"] Then that person took the book [that John had].', () => {
			const results = parse_for_test('John said, ["What do you(person) want?"] Then that person took the book [that John had].')

			expect(results).length(24)
			for (let token of results) {
				expect(token.error_message).toBe('')
			}
		})
	})

	describe('problems detected', () => {
		test('bad_notesNotation[badbracket you', () => {
			const results = parse_for_test('bad_notesNotation[badbracket you')

			expect(results[0].token).toBe('bad_notesNotation[badbracket')
			expect(results[0].error_message).toEqual(ERRORS.NO_SPACE_BEFORE_UNDERSCORE)
			expect(results[1].token).toBe('you')
			expect(results[1].error_message).toMatch(/^Second person pronouns/)
			expect(results[2].token).toBe('.')
			expect(results[2].error_message).toEqual(ERRORS.MISSING_PERIOD)
			expect(results[3].token).toBe(']')
			expect(results[3].error_message).toEqual(ERRORS.MISSING_CLOSING_BRACKET)
			expect(results).length(4)
		})

		test('Ok _notesNotation text[badbracket you', () => {
			const results = parse_for_test('Ok _notesNotation text[badbracket you')

			expect(results[0].token).toBe('Ok')
			expect(results[0].error_message).toBe('')
			expect(results[1].token).toBe('_notesNotation')
			expect(results[1].error_message).toBe('')
			expect(results[2].token).toBe('text[')
			expect(results[2].error_message).toEqual(ERRORS.NO_SPACE_BEFORE_OPENING_BRACKET)
			expect(results[3].token).toBe('badbracket')
			expect(results[3].error_message).toBe('')
			expect(results[4].token).toBe('you')
			expect(results[4].error_message).toMatch(/^Second person pronouns/)
			expect(results[5].token).toBe('.')
			expect(results[5].error_message).toEqual(ERRORS.MISSING_PERIOD)
			expect(results[6].token).toBe(']')
			expect(results[6].error_message).toEqual(ERRORS.MISSING_CLOSING_BRACKET)
			expect(results).length(7)
		})

		test('Ok _notesNotation [fixedbracket you', () => {
			const results = parse_for_test('Ok _notesNotation [fixedbracket you')

			expect(results[0].token).toBe('Ok')
			expect(results[0].error_message).toBe('')
			expect(results[1].token).toBe('_notesNotation')
			expect(results[1].error_message).toBe('')
			expect(results[2].token).toBe('[')
			expect(results[2].error_message).toBe('')
			expect(results[3].token).toBe('fixedbracket')
			expect(results[3].error_message).toBe('')
			expect(results[4].token).toBe('you')
			expect(results[4].error_message).toMatch(/^Second person pronouns/)
			expect(results[5].token).toBe('.')
			expect(results[5].error_message).toEqual(ERRORS.MISSING_PERIOD)
			expect(results[6].token).toBe(']')
			expect(results[6].error_message).toEqual(ERRORS.MISSING_CLOSING_BRACKET)
			expect(results).length(7)
		})

		test('Ok _notesNotation [fixedbracket you(Paul', () => {
			const results = parse_for_test('Ok _notesNotation [fixedbracket you(Paul')

			expect(results[0].token).toBe('Ok')
			expect(results[0].error_message).toBe('')
			expect(results[1].token).toBe('_notesNotation')
			expect(results[1].error_message).toBe('')
			expect(results[2].token).toBe('[')
			expect(results[2].error_message).toBe('')
			expect(results[3].token).toBe('fixedbracket')
			expect(results[3].error_message).toBe('')
			expect(results[4].token).toBe('you(Paul')
			expect(results[4].error_message).toEqual(ERRORS.MISSING_CLOSING_PAREN)
			expect(results[5].token).toBe('.')
			expect(results[5].error_message).toEqual(ERRORS.MISSING_PERIOD)
			expect(results[6].token).toBe(']')
			expect(results[6].error_message).toEqual(ERRORS.MISSING_CLOSING_BRACKET)
			expect(results).length(7)
		})

		test('Ok _notesNotation [fixedbracket you(Paul).', () => {
			const results = parse_for_test('Ok _notesNotation [fixedbracket you(Paul)')

			expect(results[0].token).toBe('Ok')
			expect(results[0].error_message).toBe('')
			expect(results[1].token).toBe('_notesNotation')
			expect(results[1].error_message).toBe('')
			expect(results[2].token).toBe('[')
			expect(results[2].error_message).toBe('')
			expect(results[3].token).toBe('fixedbracket')
			expect(results[3].error_message).toBe('')
			expect(results[4].token).toBe('Paul')
			expect(results[4].error_message).toBe('')
			expect(results[5].token).toBe('.')
			expect(results[5].error_message).toEqual(ERRORS.MISSING_PERIOD)
			expect(results[6].token).toBe(']')
			expect(results[6].error_message).toEqual(ERRORS.MISSING_CLOSING_BRACKET)
			expect(results).length(7)
		})

		test('Paul explained [the Christ needed to become alive again]].', () => {
			const results = parse_for_test('Paul explained [the Christ needed to become alive again]].')

			expect(results[0].token).toBe('[')
			expect(results[0].error_message).toEqual(ERRORS.MISSING_OPENING_BRACKET)
			expect(results[1].token).toBe('Paul')
			expect(results[1].error_message).toBe('')
			expect(results[2].token).toBe('explained')
			expect(results[2].error_message).toBe('')
			expect(results[3].token).toBe('[')
			expect(results[3].error_message).toBe('')
			expect(results[4].token).toBe('the')
			expect(results[4].error_message).toBe('')
			expect(results[5].token).toBe('Christ')
			expect(results[5].error_message).toBe('')
			expect(results[6].token).toBe('needed')
			expect(results[6].error_message).toBe('')
			expect(results[7].token).toBe('to')
			expect(results[7].error_message).toBe('')
			expect(results[8].token).toBe('become')
			expect(results[8].error_message).toBe('')
			expect(results[9].token).toBe('alive')
			expect(results[9].error_message).toBe('')
			expect(results[10].token).toBe('again')
			expect(results[10].error_message).toBe('')
			expect(results[11].token).toBe(']')
			expect(results[11].error_message).toBe('')
			expect(results[12].token).toBe(']')
			expect(results[12].error_message).toBe('')
			expect(results[13].token).toBe('.')
			expect(results[13].error_message).toBe('')
			expect(results).length(14)
		})

		test('John said, ["what do you(person) want?" then that person took the book that John had]', () => {
			const results = parse_for_test('John said, ["what do you(person) want?" then that person took the book that John had]')
	
			expect(results[0].token).toBe('John')
			expect(results[0].error_message).toBe('')
			expect(results[1].token).toBe('said')
			expect(results[1].error_message).toBe('')
			expect(results[2].token).toBe(',')
			expect(results[2].error_message).toBe('')
			expect(results[3].token).toBe('[')
			expect(results[3].error_message).toBe('')
			expect(results[4].token).toBe('"')
			expect(results[4].error_message).toBe('')
			expect(results[5].token).toBe('what')
			expect(results[5].error_message).toEqual(ERRORS.FIRST_WORD_NOT_CAPITALIZED)
			expect(results[6].token).toBe('do')
			expect(results[6].error_message).toBe('')
			expect(results[7].token).toBe('person')
			expect(results[7].error_message).toBe('')
			expect(results[8].token).toBe('want')
			expect(results[8].error_message).toBe('')
			expect(results[9].token).toBe('?')
			expect(results[9].error_message).toBe('')
			expect(results[10].token).toBe('"')
			expect(results[10].error_message).toBe('')
			expect(results[11].token).toBe(']')
			expect(results[11].error_message).toEqual(ERRORS.MISSING_CLOSING_BRACKET)
			expect(results[12].token).toBe('[')
			expect(results[12].error_message).toEqual(ERRORS.MISSING_OPENING_BRACKET)
			expect(results[13].token).toBe('then')
			expect(results[13].error_message).toEqual(ERRORS.FIRST_WORD_NOT_CAPITALIZED)
			expect(results[14].token).toBe('that')
			expect(results[14].error_message).toBe('')
			expect(results[15].token).toBe('person')
			expect(results[15].error_message).toBe('')
			expect(results[16].token).toBe('took')
			expect(results[16].error_message).toBe('')
			expect(results[17].token).toBe('the')
			expect(results[17].error_message).toBe('')
			expect(results[18].token).toBe('book')
			expect(results[18].error_message).toBe('')
			expect(results[19].token).toBe('that')
			expect(results[19].error_message).toBe('')
			expect(results[20].token).toBe('John')
			expect(results[20].error_message).toBe('')
			expect(results[21].token).toBe('had')
			expect(results[21].error_message).toBe('')
			expect(results[22].token).toBe(']')
			expect(results[22].error_message).toBe('')
			expect(results[23].token).toBe('.')
			expect(results[23].error_message).toEqual(ERRORS.MISSING_PERIOD)
			expect(results).length(24)
		})
	})
})
