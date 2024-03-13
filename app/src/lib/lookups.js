import { TOKEN_TYPE } from './parser/token'
import { REGEXES } from './regexes'

// TODO move whole token pipeline to the server

/**
 * 
 * @param {Sentence[]} sentences 
 * @returns {Promise<Sentence[]>}
 */
export async function perform_form_lookups(sentences) {
	const lookup_tokens = sentences.flatMap(flatten_for_lookup).filter(is_lookup_token)

	await Promise.all(lookup_tokens.map(check_forms))

	return sentences
}

/**
 * 
 * @param {Sentence[]} sentences 
 * @returns {Promise<Sentence[]>}
 */
export async function perform_ontology_lookups(sentences) {
	const lookup_tokens = sentences.flatMap(flatten_for_lookup).filter(is_lookup_token)

	// TODO only send one api request for all occurrences of a term
	await Promise.all(lookup_tokens.map(check_ontology))

	return sentences
}

/**
 * 
 * @param {Sentence} sentence 
 * @returns {Token[]}
 */
function flatten_for_lookup(sentence) {
	return flatten_tokens(sentence.clause)

	/**
	 * 
	 * @param {Token} token 
	 * @returns {Token[]}
	 */
	function flatten_tokens(token) {
		if (token.type === TOKEN_TYPE.CLAUSE) {
			return token.sub_tokens.flatMap(flatten_tokens)
		} else if (token.complex_pairing) {
			return [token, token.complex_pairing]
		}
		return [token]
	}
}

/**
 * 
 * @param {Token} token 
 * @returns {boolean}
 */
function is_lookup_token(token) {
	return token.type === TOKEN_TYPE.LOOKUP_WORD
}

/**
 * @param {Token} lookup_token
 */
async function check_forms(lookup_token) {
	// At this point there is always just one lookup term
	const { stem, sense } = split_stem_and_sense(lookup_token.lookup_terms[0])

	const response = await fetch(`/lookup/form?word=${stem}`)

	/** @type {LookupResponse<FormResult>} */
	const results = await response.json()

	lookup_token.lookup_results = results.matches.map(transform_result)

	if (results.matches.length === 0) {
		return
	}

	// The form lookup may have resulted in different stems (eg. saw).
	// So add a lookup term for each unique stem (case-insensitive)
	const unique_stems = new Set(results.matches.map(({ stem }) => stem.toLowerCase()))

	// Add the original lookup stem in case there is a missing form (eg. Adjectives left, following)
	unique_stems.add(stem.toLowerCase())

	// Reattach the sense if present
	lookup_token.lookup_terms = sense ? [...unique_stems].map(stem => `${stem}-${sense}`) : [...unique_stems]

	/**
	 * 
	 * @param {FormResult} form_result 
	 * @returns {LookupResult}
	 */
	function transform_result({ stem, part_of_speech, form }) {
		return {
			stem,
			part_of_speech,
			form,
			concept: null,
			how_to: [],
		}
	}
}

/**
 * @param {Token} lookup_token
 */
async function check_ontology(lookup_token) {
	const results = (await Promise.all(lookup_token.lookup_terms.map(check_word_in_ontology))).flat()

	const found_results = results.map(transform_result)
	const not_found_results = lookup_token.lookup_results.filter(lookup => !results.some(result => lookups_match(lookup, result)))
	lookup_token.lookup_results = found_results.concat(not_found_results)

	/**
	 * 
	 * @param {string} lookup 
	 * @returns {Promise<OntologyResult[]>}
	 */
	async function check_word_in_ontology(lookup) {
		const response = await fetch(`/lookup/ontology?word=${lookup}`)

		/** @type {LookupResponse<OntologyResult>} */
		const results = await response.json()
		let matches = results.matches

		return matches
	}

	/**
	 * 
	 * @param {OntologyResult} ontology_result 
	 * @returns {LookupResult}
	 */
	function transform_result(ontology_result) {
		const existing_result = lookup_token.lookup_results.find(lookup => lookups_match(lookup, ontology_result))
		return {
			stem: ontology_result.stem,
			part_of_speech: ontology_result.part_of_speech,
			form: existing_result?.form ?? 'stem',
			concept: ontology_result,
			how_to: [],
		}
	}
}

/**
 * 
 * @param {LookupWord} lookup1 
 * @param {LookupWord} lookup2 
 * @returns {boolean}
 */
function lookups_match(lookup1, lookup2) {
	return lookup1.stem === lookup2.stem && lookup1.part_of_speech === lookup2.part_of_speech
}