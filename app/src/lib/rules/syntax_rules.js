import {create_context_filter, create_token_filter} from './rules_parser'
import {REGEXES} from '$lib/regexes'
import {TOKEN_TYPE} from '$lib/parser/token'
import {ERRORS} from '$lib/parser/error_messages'

/** @typedef {{name: string, comment: string, rule: TokenRule}} HardCodedRule */

/**
 * These rules are hardcoded because they shouldn't need to be edited or added to by the user.
 * They don't need to be extendable, but are still able to be used within the rule system.
 */
/** @type {HardCodedRule[]} */
const syntax_rule_info = [
	{
		name: 'A subordinate clause is a Patient by default',
		comment: '',
		rule: {
			trigger: token_is_subordinate_clause,
			context: create_context_filter({}),
			action: (tokens, trigger_index) => {
				tokens[trigger_index].tag = 'patient_clause'
				return trigger_index + 1
			},
		},
	},
	{
		name: 'Set tag for quote clauses',
		comment: '',
		rule: {
			trigger: subordinate_clause_starts_with(create_token_filter({'token': '"'})),
			context: create_context_filter({}),
			action: (tokens, trigger_index) => {
				tokens[trigger_index].tag = 'patient_clause|quote_begin'
				return trigger_index + 1
			},
		},
	},
	{
		name: 'Set tag for relative clauses',
		comment: 'removes extra tags for words like "who" and "which". "that" is handled again in the next rule',
		rule: {
			trigger: subordinate_clause_starts_with(create_token_filter({'tag': 'relativizer'})),
			context: create_context_filter({ 'precededby': { 'category': 'Noun'} }),
			action: (tokens, trigger_index) => {
				tokens[trigger_index].tag = 'relative_clause'
				tokens[trigger_index].sub_tokens[1].tag = 'relativizer'
				return trigger_index + 1
			},
		},
	},
	{
		name: 'Set tag for "that" when preceded by a Noun',
		comment: '"that" could still be a relativizer OR complementizer at the start of a subordinate clause (but never a demonstrative)',
		rule: {
			trigger: subordinate_clause_starts_with(create_token_filter({'token': 'that'})),
			context: create_context_filter({}),
			action: (tokens, trigger_index) => {
				tokens[trigger_index].tag = 'patient_clause|relative_clause'
				tokens[trigger_index].sub_tokens[1].tag = 'relativizer|complementizer'
				return trigger_index + 1
			},
		},
	},
	{
		name: 'All Clauses that have adpositions are Adverbial clauses',
		comment: '',
		rule: {
			trigger: subordinate_clause_starts_with(create_token_filter({'category': 'Adposition'})),
			context: create_context_filter({}),
			action: (tokens, trigger_index) => {
				tokens[trigger_index].tag = 'adverbial_clause'
				return trigger_index + 1
			},
		},
	},
	{
		name: 'Set tag for agent propositions of the form "[] Verb"',
		comment: 'eg. [You(person) obey God] is good. Add filter for relative clause in case of a sentence like: The book [that is on the table] is good.',
		rule: {
			trigger: token => token_is_subordinate_clause(token) && !token.tag.includes('relative_clause'),
			context: create_context_filter({ 'followedby': { 'category': 'Verb' }}),
			action: (tokens, trigger_index) => {
				tokens[trigger_index].tag = 'agent_clause'
				return trigger_index + 1
			},
		},
	},
	{
		name: 'Set tag for agent propositions of the form "It... [that..."',
		comment: 'eg. It pleases God [that people obey God].',
		rule: {
			trigger: token_is_subordinate_clause,
			context: create_context_filter({ 'precededby': { 'tag': 'agent_proposition', 'skip': 'all' }}),
			action: (tokens, trigger_index) => {
				tokens[trigger_index].tag = 'agent_clause'
				return trigger_index + 1
			},
		},
	},
	{
		name: 'Check capitalization for first word in a sentence or quote',
		comment: '',
		rule: {
			trigger: create_token_filter({ 'tag': 'main_clause|quote_begin' }),
			context: create_context_filter({}),
			action: (tokens, trigger_index) => {
				// find first word token, even if nested in another clause
				const word_token = find_first_word(tokens[trigger_index])
				if (!word_token) {
					return trigger_index + 1
				}

				word_token.tag = word_token.tag ? `${word_token.tag}|first_word` : 'first_word'
				if (starts_lowercase(word_token.token)) {
					word_token.type = TOKEN_TYPE.ERROR
					word_token.message = word_token.message || ERRORS.FIRST_WORD_NOT_CAPITALIZED
				}
				return trigger_index + 1
			},
		},
	},
	{
		name: 'Filter lookup results based on upper/lowercase for words not at the start of the sentence.',
		comment: '',
		rule: {
			trigger: token => token.type === TOKEN_TYPE.LOOKUP_WORD && !token.tag.includes('first_word'),
			context: create_context_filter({}),
			action: (tokens, trigger_index) => {
				const token = tokens[trigger_index]
				filter_results_by_capitalization(token)
				if (token.complex_pairing) {
					filter_results_by_capitalization(token.complex_pairing)
				}
				return trigger_index + 1
			},
		},
	},
]

export const SYNTAX_RULES = syntax_rule_info.map(rule => rule.rule)

/**
 * 
 * @param {Token} token 
 */
function token_is_subordinate_clause(token) {
	return token.type === TOKEN_TYPE.CLAUSE
		&& token.sub_tokens.length > 0
		&& token.sub_tokens[0].token === '['
		&& token.sub_tokens[0].type !== TOKEN_TYPE.ERROR
}

/**
 * 
 * @param {TokenFilter} first_token_filter 
 * @returns {TokenFilter}
 */
function subordinate_clause_starts_with(first_token_filter) {
	return clause => clause.type === TOKEN_TYPE.CLAUSE
		&& clause.sub_tokens.length > 1
		&& clause.sub_tokens[0].token === '['
		&& first_token_filter(clause.sub_tokens[1])
}

/**
 * 
 * @param {Token} token 
 * @returns {Token|undefined}
 */
export function find_first_word(token) {
	if (token_is_word(token)) {
		return token
	}
	for (let sub_token of token.sub_tokens) {
		const result = find_first_word(sub_token)
		if (result) {
			return result
		}
	}
	return undefined

	/**
	 * 
	 * @param {Token} token 
	 * @returns {boolean}
	 */
	function token_is_word(token) {
		/** @type {TokenType[]} */
		const word_types = [TOKEN_TYPE.LOOKUP_WORD, TOKEN_TYPE.FUNCTION_WORD]

		return word_types.includes(token.type)
			|| token.token.length > 0 && REGEXES.WORD_START_CHAR.test(token.token[0])
	}
}

/**
 * 
 * @param {string} text 
 * @returns {boolean}
 */
function starts_lowercase(text) {
	return REGEXES.STARTS_LOWERCASE.test(text)
}

/**
 * 
 * @param {Token} token 
 */
function filter_results_by_capitalization(token) {
	// filter results based on capitalization
	token.lookup_results = starts_lowercase(token.token)
		? token.lookup_results.filter(result => starts_lowercase(result.stem))
		: token.lookup_results.filter(result => !starts_lowercase(result.stem))
}