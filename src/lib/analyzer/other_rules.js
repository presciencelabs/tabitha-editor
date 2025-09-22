import { create_context_filter, create_token_filter } from '$lib/rules/rules_parser'
import { create_lookup_result, TOKEN_TYPE } from '$lib/token'

/** @type {[string, TokenFilter][]} */
const PUNCTUATION_PARTICLES = [
	['exclamation', create_token_filter({ 'token': '!' })],
	['-QuoteBegin', create_token_filter({ 'token': '"', 'tag': { 'quote': 'begin' } })],
	['-QuoteEnd', create_token_filter({ 'token': '"' })],
	['-CommentBegin', create_token_filter({ 'token': '(comment-begin)|(begin-comment)' })],
	['-CommentEnd', create_token_filter({ 'token': '(comment-end)|(end-comment)' })],
]

/**
 * @param {Sentence[]} sentences 
 * @returns {Sentence[]} 
 */
export function replace_punctuation(sentences) {
	return replace_punctuation_tokens(sentences.map(sentence => sentence.clause)).map(clause => ({ clause }))

	/**
	 * @param {Token[]} tokens 
	 * @returns {Token[]}
	 */
	function replace_punctuation_tokens(tokens) {
		return tokens.map(replace_punctuation_token)
	}

	/**
	 * @param {Token} token 
	 * @returns {Token}
	 */
	function replace_punctuation_token(token) {
		if (token.sub_tokens.length) {
			token.sub_tokens = replace_punctuation_tokens(token.sub_tokens)
			return token
		}
		
		const particle_entry = PUNCTUATION_PARTICLES.find(([_, filter]) => filter(token))
		if (particle_entry) {
			const [stem, _] = particle_entry
			return {
				...token,
				token: stem,
				type: TOKEN_TYPE.LOOKUP_WORD,
				lookup_results: [create_lookup_result({ stem, part_of_speech: 'Particle' }, { sense: 'A', ontology_status: 'present' })],
			}
		}
		return token
	}
}

/**
 * @typedef {string} NounListIndex
 * @typedef {[NounListIndex, { stem: string, sense: string }][]} NounList
 * @param {SimpleSourceEntity[]} entities 
 * @returns {NounList}
 */
export function populate_noun_list(entities) {
	/** @type {NounList} */
	const noun_list = []

	entities.forEach(entity => {
		if (!entity.concept || entity.concept.part_of_speech !== 'Noun') {
			return
		}
		const current_noun = { stem: entity.concept.stem, sense: entity.concept.sense }

		const existing = noun_list.find(([_, noun]) => noun.stem === current_noun.stem && noun.sense === current_noun.sense)?.[0]
		if (!existing) {
			const noun_list_index = next_noun_index()
			noun_list.push([noun_list_index, current_noun])
			entity.features.push({ name: 'Noun List Index', value: noun_list_index })
		}
	})

	return noun_list

	/**
	 * @returns {NounListIndex}
	 */
	function next_noun_index() {
		const next = noun_list.length + 1
		if (next >= 10) {
			// index 10 and up use capital letters starting with A (ascii 65)
			return String.fromCharCode(65 + next - 10)
		} else {
			return next.toString()
		}
	}

	/**
	 * @param {Token[]} tokens 
	 * @param {number} index 
	 * @returns {number|undefined}
	 */
	function get_index_note(tokens, index) {
		const index_note_context_filter = create_context_filter({ 'followedby': { 'token': '_1|_2|_3|_4' } })
		const note_index = index_note_context_filter(tokens, index).context_indexes.at(0)
		return note_index ? Number(tokens[note_index].token.substring(1)) : undefined
	}
}