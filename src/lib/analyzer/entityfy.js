import { token_has_tag, TOKEN_TYPE } from '$lib/token'
import { get_features_for_token } from './features'

/**
 * 
 * @param {Sentence[]} sentences 
 * @returns {SimpleSourceEntity[]}
 */
export function entityfy(sentences) {
	return entityfy_tokens(sentences.map(sentence => sentence.clause))

	/**
	 * 
	 * @param {Token[]} tokens 
	 * @returns {SimpleSourceEntity[]}
	 */
	function entityfy_tokens(tokens) {
		return tokens.flatMap((_, index, tokens) => entityfy_token(tokens, index))
	}

	/**
	 * 
	 * @param {Token[]} tokens 
	 * @param {number} token_index 
	 * @returns {SimpleSourceEntity[]}
	 */
	function entityfy_token(tokens, token_index) {
		const token = tokens[token_index]
		const category = get_token_category(token)
		if (!category) {
			return []
		}

		const features = get_features_for_token(tokens, token_index, category)
		if (category === 'Clause') {
			if (token_has_tag(token, { 'clause_type': 'main_clause' })) {
				return [
					create_source_entity({ category, value: '{', features }),
					...entityfy_tokens(token.sub_tokens),
					create_source_entity({ category: '.', value: '.' }),
					create_source_entity({ value: '}' }),
				]
			} else {
				return [
					create_source_entity({ category, value: '[', features }),
					...entityfy_tokens(token.sub_tokens),
					create_source_entity({ value: ']' }),
				]
			}

		} else if (token.token.startsWith('{')) {
			// A phrase start
			return [create_source_entity({ category, value: '(', features })]

		} else if (token.token === '}') {
			// A phrase end
			return [create_source_entity({ value: ')' })]

		} else if (token.lookup_results.length) {
			const concept = convert_to_concept(token)
			const pairing_concept = token.pairing ? convert_to_concept(token.pairing) : null
			return [create_source_entity({ category, features, concept, pairing_concept, pairing_type: token.pairing_type })]

		} else {
			return []
		}
	}

	/**
	 * @param {Token} token
	 * @returns {SourceConcept}
	 */
	function convert_to_concept(token) {
		const { stem, sense, part_of_speech } = token.lookup_results[0]
		return { stem, sense, part_of_speech }
	}
}

/**
 * 
 * @param {Object} [data={}]
 * @param {CategoryName} [data.category='']
 * @param {string} [data.value='']
 * @param {EntityFeature[]} [data.features=[]]
 * @param {SourceConcept?} [data.concept=null]
 * @param {SourceConcept?} [data.pairing_concept=null]
 * @param {PairingType} [data.pairing_type='none']
 */
function create_source_entity({ category='', value='', features=[], concept=null, pairing_concept=null, pairing_type='none' }={}) {
	if (!value && concept) {
		value = pairing_concept ? `${concept.stem}/${pairing_concept.sense}${pairing_concept.stem}` : concept.stem
	}
	return {
		category,
		value,
		features,
		concept,
		pairing_concept,
		pairing_type,
	}
}

/**
 * @param {Token} token 
 * @returns {CategoryName?}
 */
function get_token_category(token) {
	if (token.type === TOKEN_TYPE.CLAUSE) {
		return 'Clause'
	} else if (token.type === TOKEN_TYPE.PHRASE) {
		// A phrase token is in the format like "{NP" or "{AdjP"
		return token.token.startsWith('{') ? token.token.substring(1) : 'P_END'
	} else if (token.lookup_results.length) {
		return token.lookup_results[0].part_of_speech
	} else {
		return null
	}
}