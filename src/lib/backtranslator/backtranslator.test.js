import { backtranslate, textify } from '.'
import { describe, expect, test } from 'vitest'
import { MESSAGE_TYPE, create_added_token } from '$lib/token'
import { tokenize_input } from '$lib/parser/tokenize'
import { clausify } from '$lib/parser/clausify'
import { parse } from '$lib/parser'

/**
 * textify simply produces the plain text equivalent for each token, joined by a space.
 */
describe('Textify', () => {

	test('You(people) will become-J _randomNote a house of the Spirit.', () => {
		const test_tokens = tokenize_input('You(people) will become-J _randomNote a house of the Spirit.')
		const expected = 'You will become a house of the Spirit .'

		const result = textify(clausify(test_tokens))
		expect(result).toBe(expected)
	})

	test('Jesus said to Jesus\' followers/disciples _implicit, ["You(followers) (imp) go."]', () => {
		const test_tokens = tokenize_input('Jesus said to Jesus\' followers/disciples _implicit, ["You(followers) (imp) go."]')
		const expected = 'Jesus said to Jesus\' disciples , " You (imp) go . "'

		const result = textify(clausify(test_tokens))
		expect(result).toBe(expected)
	})

	test('Added token', () => {
		const test_tokens = tokenize_input('This is a test.')
		test_tokens.splice(2, 0, create_added_token('added', { ...MESSAGE_TYPE.ERROR, message: 'message' }))
		const expected = 'This is a test .'

		const result = textify(clausify(test_tokens))
		expect(result).toBe(expected)
	})

})

/**
 * @param {Object} param
 * @param {string} [param.input_text]
 * @param {string} [param.expected_text]
 */
async function test_back_translation({ input_text='', expected_text='' }) {
	const test_sentences = await parse(input_text)
	const result = backtranslate(test_sentences)
	expect(result).toEqual(expected_text)
}

describe('Structural', () => {
	test('Imperatives', async () => {
		await test_back_translation({
			input_text: 'You(person) (imp) go. And you(person) (imp) be happy.',
			expected_text: 'Go. And be happy.',
		})
	})
	test('Different Participant Patient Clauses', async () => {
		await test_back_translation({
			input_text: 'John knew [Mary was speaking].',
			expected_text: 'John knew that Mary was speaking.',
		})
		await test_back_translation({
			input_text: 'John saw [Mary was speaking] [and Paul was sitting].',
			expected_text: 'John saw that Mary was speaking and that Paul was sitting.',
		})
		await test_back_translation({
			input_text: 'John heard [Mary speaking].',
			expected_text: 'John heard Mary speaking.',
		})
		await test_back_translation({
			input_text: 'John wanted [Mary to speak]. John prevented [Mary from speaking].',
			expected_text: 'John wanted Mary to speak. John prevented Mary from speaking.',
		})
	})
	test('Descriptive Relative Clauses', async () => {
		await test_back_translation({
			input_text: 'John [who was with Mary] read that book [_descriptive which was big].',
			expected_text: 'John, who was with Mary, read that book, which was big.',
		})
	})
	test('Sentence-initial Adverbial Clauses', async () => {
		await test_back_translation({
			input_text: '[When John saw Mary] John was happy. And [when Mary saw John] Mary was happy.',
			expected_text: 'When John saw Mary, John was happy. And when Mary saw John, Mary was happy.',
		})
		await test_back_translation({
			input_text: "Therefore [when I(John) come to your(Gaius's) town _implicit,] I(John) will be happy.",
			expected_text: "Therefore when I come <<to your town>>, I will be happy.",
		})
	})
	test('"city named X" -> "city of X"', async () => {
		await test_back_translation({
			input_text: 'John went to the city named Jerusalem.',
			expected_text: 'John went to the city of Jerusalem.',
		})
	})
	test('Relative clause positioning', async () => {
		await test_back_translation({
			input_text: 'John saw the horse [that was big] [and that ate grass] of Paul.',
			expected_text: 'John saw the horse of Paul that was big and that ate grass.',
		})
	})
	test('Explain Name', async () => {
		await test_back_translation({
			input_text: 'John slept at Baal-Peor named a place _explainName.',
			expected_text: 'John slept at <<a place named>> Baal Peor.',
		})
	})
	test('Literal and Dynamic expansion', async () => {
		await test_back_translation({
			input_text: 'The Lord of the holy eyes _literalExpansion sees all things.',
			expected_text: 'The holy eyes of the Lord sees all things.',
		})
		await test_back_translation({
			input_text: 'You(people) (imp) listen to the Lord of the words _literalExpansion.',
			expected_text: 'Listen to the words of the Lord.',
		})
		await test_back_translation({
			input_text: 'Herod of the many soldiers _dynamicExpansion killed those people.',
			expected_text: '<<The many soldiers of>> Herod killed those people.',
		})
		await test_back_translation({
			input_text: 'Those people went to Herod of the palace _dynamicExpansion.',
			expected_text: 'Those people went to <<the palace of>> Herod.',
		})
	})
	test('Implicit phrases', async () => {
		await test_back_translation({
			input_text: "That snake was thrown by Michael _implicitActiveAgent and by Michael's servants _implicitActiveAgent out of heaven _implicit.",
			expected_text: "That snake was thrown <<by Michael and by Michael's servants>> out <<of heaven>>.",
		})
		await test_back_translation({
			input_text: "I(Jesus) am standing at your(follower's) _implicit door.",
			expected_text: "I am standing at <<your>> door.",
		})
		await test_back_translation({
			input_text: "God saved all _implicit of us(Jews) from bad-B actions and death. Those things were given/entrusted by God _implicitActiveAgent to God's _implicit special/holy people.",
			expected_text: "God saved <<all of>> us from bad actions and death. Those things were entrusted <<by God>> to <<God's>> holy people.",
		})
		await test_back_translation({
			input_text: "The father of that man _implicitNecessary saw a big happy _implicitABC lion and that lion's children _implicit.",
			expected_text: "The father <of that man> saw a big <<happy>> lion <<and that lion's children>>.",
		})
	})
	test('Implicit clauses', async () => {
		await test_back_translation({
			input_text: '(implicit-subaction) John left. John bought food [because (implicit-situational) John was hungry].',
			expected_text: '<<John left.>> John bought food <<because John was hungry>>.',
		})
	})
	test("God's book -> the Scriptures", async () => {
		await test_back_translation({
			input_text: 'God\'s book says, "Yes." You(people) should read God\'s book.',
			expected_text: 'The Scriptures say, "Yes." You should read the Scriptures.',
		})
	})
	test('Numbers', async () => {
		await test_back_translation({
			input_text: 'John read 2 books. John read Matthew 2:2.',
			expected_text: 'John read two books. John read Matthew 2:2.',
		})
	})
})
