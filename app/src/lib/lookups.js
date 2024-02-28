import {TOKEN_TYPE, flatten_sentence} from './parser/token'

// TODO move whole token pipeline to the server

/**
 * 
 * @param {Sentence[]} sentences 
 * @returns {Promise<Sentence[]>}
 */
export async function perform_form_lookups(sentences) {
	const lookup_tokens = sentences.flatMap(flatten_sentence).filter(is_lookup_token)

	await Promise.all(lookup_tokens.map(check_forms))

	return sentences
}

/**
 * 
 * @param {Sentence[]} sentences 
 * @returns {Promise<Sentence[]>}
 */
export async function perform_ontology_lookups(sentences) {
	const lookup_tokens = sentences.flatMap(flatten_sentence).filter(is_lookup_token)

	await Promise.all(lookup_tokens.map(check_ontology))

	return sentences
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
	const response = await fetch(`/form-lookup?word=${lookup_token.lookup_term}`)

	/** @type {LookupResult<FormResult>} */
	const results = await response.json()

	lookup_token.form_results = results.matches
	
	// if the lookup term starts with lowercase, remove results that start with uppercase
	if (starts_lowercase(lookup_token.lookup_term)) {
		lookup_token.form_results = lookup_token.form_results.filter(result => starts_lowercase(result.stem))
	}

	if (results.matches.length) {
		// maintain the sense marker if present
		const sense_match = lookup_token.lookup_term.match(/^(.+)(-[A-Z])$/)
		const sense = sense_match?.[2]

		// the new lookup stem can be the form stem if they are all the same.
		// otherwise use the original lookup term
		const stem = all_elements_the_same(lookup_token.form_results, result => result.stem)
			? results.matches[0].stem : sense_match?.[1] ?? lookup_token.lookup_term

		lookup_token.lookup_term = sense ? `${stem}${sense}` : stem
	}
}

/**
 * @param {Token} lookup_token
 */
async function check_ontology(lookup_token) {
	// The form lookup may have resulted in different stems (eg. saw). We want to look up all of them
	if (!all_elements_the_same(lookup_token.form_results, result => result.stem.toLowerCase())) {
		const unique_lookups = [...new Set(lookup_token.form_results.map(form => form.stem))]

		const results = await Promise.all(unique_lookups.map(check_word_in_ontology))
		lookup_token.lookup_results = results.flat()

	} else {
		lookup_token.lookup_results = await check_word_in_ontology(lookup_token.lookup_term)
	}
	
	// filter out results based on form data
	if (lookup_token.form_results.length) {
		const forms = lookup_token.form_results
		lookup_token.lookup_results = lookup_token.lookup_results
			.filter(lookup => forms.some(form => form.part_of_speech === lookup.part_of_speech))
	}
	

	/**
	 * 
	 * @param {string} lookup 
	 * @returns {Promise<OntologyResult[]>}
	 */
	async function check_word_in_ontology(lookup) {
		const response = await fetch(`/ontology-lookup?word=${lookup}`)

		/** @type {LookupResult<OntologyResult>} */
		const results = await response.json()
		let matches = results.matches
		
		// if the lookup term starts with lowercase, remove results that start with uppercase
		if (starts_lowercase(lookup)) {
			matches = matches.filter(result => starts_lowercase(result.stem))
		}

		return matches
	}
}

/**
 * 
 * @param {string} word 
 * @returns {boolean}
 */
function starts_lowercase(word) {
	return word[0].toLowerCase() === word[0]
}

/**
 * @template R
 * @param {R[]} arr 
 * @param {(elem: R) => any} getter 
 * @returns {boolean}
 */
function all_elements_the_same(arr, getter) {
	return arr.every(elem => getter(elem) === getter(arr[0]))
}