import { REGEXES } from '$lib/regexes'

/** @type {TokenType} */
const PUNCTUATION = 'Punctuation'

/** @type {TokenType} */
const NOTE = 'Note'

/** @type {TokenType} */
const FUNCTION_WORD = 'FunctionWord'

/** @type {TokenType} */
const LOOKUP_WORD = 'Word'

/** @type {TokenType} */
const CLAUSE = 'Clause'

/** @type {TokenType} */
const ADDED = 'Added'

export const TOKEN_TYPE = {
	PUNCTUATION,
	NOTE,
	FUNCTION_WORD,
	LOOKUP_WORD,
	CLAUSE,
	ADDED,
}

/**
 * 
 * @param {string} token 
 * @param {TokenType} type 
 * @param {Object} [other_data={}] 
 * @param {string} [other_data.error=''] 
 * @param {string} [other_data.suggest=''] 
 * @param {Tag} [other_data.tag={}] 
 * @param {string} [other_data.specified_sense=''] 
 * @param {string} [other_data.lookup_term=''] 
 * @param {Token[]} [other_data.sub_tokens=[]] 
 * @param {Token?} [other_data.pairing=null] 
 * @param {Token?} [other_data.pronoun=null] 
 * @return {Token}
 */
export function create_token(token, type, { error='', suggest= '', tag={}, specified_sense='', lookup_term='', sub_tokens=[], pairing=null, pronoun=null }={}) {
	return {
		token,
		type,
		error_message: error,
		suggest_message: suggest,
		tag,
		specified_sense,
		lookup_terms: lookup_term ? [lookup_term] : [],
		lookup_results: [],
		sub_tokens,
		complex_pairing: pairing,
		pronoun,
	}
}

/**
 * 
 * @param {string} token 
 * @param {Object} [other_data={}] 
 * @param {string} [other_data.error=''] 
 * @param {string} [other_data.suggest=''] 
 * @returns {Token}
 */
export function create_added_token(token, { error='', suggest='' }={}) {
	return create_token(token, TOKEN_TYPE.ADDED, { error, suggest })
}

/**
 * 
 * @param {Token} token 
 * @param {string} message 
 * @returns {Token}
 */
export function convert_to_error_token(token, message) {
	return { ...token, error_message: format_token_message(token, message) }
}

/**
 * 
 * @param {Token} token 
 * @param {string} message 
 * @param {Object} [context_data={}]
 * @param {Token[]} [context_data.tokens=[]]
 * @param {ContextFilterResult} [context_data.context_result]
 */
export function set_error_message(token, message, { tokens=[], context_result=default_context_result() }={}) {
	token.error_message = format_token_message(token, message, { tokens, context_result })
	return token
}

/**
 * 
 * @param {Token} token 
 * @param {string} message 
 * @param {Object} [context_data={}]
 * @param {Token[]} [context_data.tokens=[]]
 * @param {ContextFilterResult} [context_data.context_result]
 */
export function set_suggest_message(token, message, { tokens=[], context_result=default_context_result() }={}) {
	token.suggest_message = format_token_message(token, message, { tokens, context_result })
	return token
}

/**
 * TODO support markers for subtokens?
 * @param {Token} token 
 * @param {string} message 
 * @param {Object} [context_data={}]
 * @param {Token[]} [context_data.tokens=[]]
 * @param {ContextFilterResult} [context_data.context_result]
 */
export function format_token_message(token, message, { tokens=[], context_result=default_context_result() }={}) {
	return context_result.context_indexes.reduce(replace_context_markers, replace_markers(message, token))

	/**
	 * @param {string} text 
	 * @param {number} token_index 
	 * @param {number} context_number 
	 */
	function replace_context_markers(text, token_index, context_number) {
		return replace_markers(text, tokens[token_index], `${context_number}:`)
	}

	/**
	 * @param {string} text 
	 * @param {Token} token 
	 * @param {string} context_prefix 
	 */
	function replace_markers(text, token, context_prefix='') {
		const result = token.lookup_results.at(0)
		const stem = result?.stem ?? token.token
		return text
			.replaceAll(`{${context_prefix}stem}`, stem)
			.replaceAll(`{${context_prefix}token}`, token.token)
			.replaceAll(`{${context_prefix}category}`, result?.part_of_speech ?? 'word')
			.replaceAll(`{${context_prefix}sense}`, result?.concept ? concept_with_sense(result.concept) : stem)
	}
}

function default_context_result() {
	return { success: true, context_indexes: [], subtoken_indexes: [] }
}

/**
 * 
 * @param {Token[]} sub_tokens 
 * @param {Tag} tag
 */
export function create_clause_token(sub_tokens, tag={ 'clause_type': 'subordinate_clause' }) {
	return create_token('', TOKEN_TYPE.CLAUSE, { sub_tokens, tag })
}

/**
 * 
 * @param {Token} token 
 * @param {WordSense} concept 
 * @return {number}
 */
export function find_result_index(token, concept) {
	const { stem, sense } = split_stem_and_sense(concept)
	return token.lookup_results.findIndex(result => result.stem === stem && result.concept?.sense === sense)
}

/**
 * 
 * @param {Token} token 
 * @param {WordSense} concept must include the sense
 * @returns {Token}
 */
export function set_token_concept(token, concept) {
	// If a specific sense is already selected, don't overwrite it
	if (token.lookup_results.length <= 1) {
		return token
	}

	const concept_index = find_result_index(token, concept)
	const selected_result = token.lookup_results.splice(concept_index, 1)

	// put the selected sense at the top
	token.lookup_results = [...selected_result, ...token.lookup_results]
	return token
}

/**
 * 
 * @param {string} term 
 * @returns {{stem: string, sense: string}}
 */
export function split_stem_and_sense(term) {
	/** @type {RegExpMatchArray} */
	// @ts-ignore the match will always succeed
	const match = term.match(REGEXES.EXTRACT_STEM_AND_SENSE)
	return { stem: match[1], sense: match[2] ?? '' }
}

/**
 * 
 * @param {Token} token 
 * @returns {boolean}
 */
export function token_has_concept(token) {
	return token.lookup_results.some(result => result.concept)
}

/**
 * 
 * @param {Token} token 
 * @returns {boolean}
 */
export function token_has_error(token) {
	return token.error_message.length > 0
}

/**
 * 
 * @param {Token} token 
 * @returns {boolean}
 */
export function token_has_message(token) {
	return token.error_message.length > 0 || token.suggest_message.length > 0
}

/**
 * 
 * @param {Token} token 
 * @param {Tag} tag 
 */
export function add_tag_to_token(token, tag) {
	token.tag = { ...token.tag, ...tag }
}

/**
 * This checks if there is any value for a specific key, or if any of the given values
 * are present for the specified keys.
 * 
 * @param {Token} token 
 * @param {Tag | string | (Tag | string)[]} tag_to_check 
 * @returns {boolean}
 */
export function token_has_tag(token, tag_to_check) {
	if (Array.isArray(tag_to_check)) {
		return tag_to_check.some(tag => token_has_tag(token, tag))
	}
	if (typeof tag_to_check === 'string') {
		const filter_keys = tag_to_check.split('|')
		return filter_keys.some(key => token.tag[key]?.length > 0 )
	}
	return Object.entries(tag_to_check).every(([key, value]) => {
		const filter_values = value.split('|')
		const tag_values = token.tag[key]?.split('|') ?? []
		return tag_values.some(tag => filter_values.includes(tag))
	})
}

/**
 * 
 * @param {Token} token 
 * @returns {Token[]}
 */
export function flatten_token(token) {
	if (token.type === TOKEN_TYPE.CLAUSE) {
		return token.sub_tokens.flatMap(flatten_token)
	}
	return [token]
}

/**
 * 
 * @param {Sentence} sentence 
 * @returns {Token[]}
 */
export function flatten_sentence(sentence) {
	return flatten_token(sentence.clause)
}

/**
 * @param {OntologyResult} concept
 * @returns {string}
 */
export function concept_with_sense(concept) {
	return `${concept.stem}-${concept.sense}`
}

/**
 * 
 * @param {LookupWord} lookup
 * @param {Object} [other_data={}] 
 * @param {string} [other_data.form='stem'] 
 * @param {OntologyResult?} [other_data.concept=null] 
 * @param {HowToResult[]} [other_data.how_to=[]] 
 * @param {CaseFrameResult?} [other_data.case_frame=null] 
 * @returns {LookupResult}
 */
export function create_lookup_result({ stem, part_of_speech }, { form='stem', concept=null, how_to=[], case_frame=null }={}) {
	return {
		stem,
		part_of_speech,
		form,
		concept,
		how_to,
		case_frame: case_frame ?? create_case_frame({ is_valid: true, is_checked: false }),
	}
}

/**
 * 
 * @param {Object} [data={}] 
 * @param {boolean} [data.is_valid=false] 
 * @param {boolean} [data.is_checked=false] 
 * @param {RoleMatchResult[]} [data.valid_arguments=[]] 
 * @param {RoleMatchResult[]} [data.extra_arguments=[]] 
 * @param {ArgumentRoleRule[]} [data.missing_arguments=[]] 
 * @returns {CaseFrameResult}
 */
export function create_case_frame({ is_valid=false, is_checked=false, valid_arguments=[], extra_arguments=[], missing_arguments=[] }={}) {
	return {
		is_valid,
		is_checked,
		valid_arguments,
		extra_arguments,
		missing_arguments,
	}
}
