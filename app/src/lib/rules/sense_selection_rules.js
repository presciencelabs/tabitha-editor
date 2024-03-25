import { find_result_index, set_token_concept } from '$lib/parser/token'
import { create_context_filter, create_token_filter } from './rules_parser'

/**
 * These rules help decide which sense to select from the ones that match the argument structure.
 * They are ordered by priority, and can provide additional filtering of the verb or arguments to
 * narrow down the match.
 * A sense can also have multiple rows in case there are multiple incompatible filters to check.
 * TODO store these in the db
 * 
 * @typedef {[string, any]} SenseRules
 * @type {[WordStem, SenseRules[]][]}
 */
const verb_sense_rules = [
	['be', [
		// 'be' is very particular and so each sense is specified to make the priority clear. Not all verbs will need this.
		// For example, both be-I and be-F would match 'John is with Mary'
		// but be-I is more specific and should be selected over be-F.
		// senses with unique structures
		['be-A', { }],	// patient proposition
		['be-V', { }],	// agent proposition
		['be-E', { }],	// existential
		// senses with adpositions in 'state'
		['be-I', { }],	// accompaniment (with)
		['be-G', { }],	// benefactive
		['be-P', { }],	// depiction (about)
		['be-R', { }],	// partitive (part)
		['be-T', { }],	// place of origin (from)
		['be-U', { }],	// be like
		['be-X', { }],	// metaphorical
		['be-H', { 'state': { 'stem': 'day|morning|afternoon|evening|Sabbath' } }],	// temporal TODO check features of word from lexicon
		['be-W', { 'state': { 'stem': 'family|tribe' } }],
		// senses with unique agents
		['be-J', { 'agent': { 'stem': 'date' } }],	// date
		['be-K', { 'agent': { 'stem': 'name' } }],	// name
		['be-N', { 'agent': { 'stem': 'time' } }],	// time
		['be-O', { 'agent': { 'stem': 'weather' } }],	// weather
		// senses with unique states
		['be-C', { 'state': {
			'stem': 'man|woman',
			'context': { 'precededby': [{ 'tag': 'indefinite_article', 'skip': 'adjp_modifiers_attributive' }, { 'category': 'Adjective' }] },
		} }],	// class membership (eg. John is a wicked man)
		['be-Q', { 'state': { 'stem': 'bronze|clay|cloth|gold|iron|metal|sackcloth|silver|wood' } } ],	// substance (made of)
		['be-M', { 'state': { 'stem': 'ancestor|brother|child|daughter|descendant|father|husband|mother|sister|son|wife' } }],	// kinship
		['be-L', { 'state': { 'stem': 'apostle|captain|emperor|governor|judge|king|leader|officer|official|priest|prince|prophet|queen|ruler|servant|slave' } }],	// social role
		['be-S', { }],	// age
		['be-B', { }],	// equative
		// senses with adjectives
		['be-D', { }],	// predicative
		['be-F', { }],	// general locative
	]],
	['give', [
		['give-B', { 'patient': { 'stem': 'ring|vaccine' } }],
		// TODO add another give-B entry to use a lexicon feature to check for any person.
		['give-C', { 'patient': { 'stem': 'authority|law|name|peace|power|promise|skill|wisdom' } }],
	]],
	['have', [
		['have-H', { 'state': { 'stem': 'eunuch|man|servant|slave' } }],
		['have-G', { 'state': { 'stem': 'feast|party' } }],
		['have-F', { 'state': { 'stem': 'leaf|branch|wheel' } }],
		['have-D', { 'state': { 'stem': 'authority|custom|faith|hope|life|peace|power|problem|spirit|trouble' } }],
		['have-C', { 'state': { 'stem': 'wing|head|tooth|horn|eye|mouth|testicle' } }],
		['have-B', { 'state': { 'stem': 'ancestor|brother|child|cousin|daughter|descendant|family|father|father-in-law|husband|mother|mother-in-law|parent|relative|sister|son|wife' } }],
		['have-E', { 'state': { 'stem': 'AIDS|Avian-Influenza|cold|disease|fever|HIV|pain|sore|leprosy' } }],
		['have-A', { }],
		['have-I', { }],	// TODO use a lexicon feature to check for the agent being a place
	]],
	['know', [
		['know-C', { 'patient': { 'stem': 'law|meaning|name|secret|thing' } }],
	]],
	['say', [
		['say-D', { 'agent': { 'stem': 'law' } }],
	]],
	['see', [
		['see-D', { 'patient': { 'stem': 'dream|vision' } }],
		['see-C', { }],	// prioritize see-C over see-B gets selected
	]],
	['speak', [
		['speak-B', { }],	// prioritize speak-B over speak-A
	]],
	['tell', [
		// prioritize tell-C over tell-A due to the presence of the 'about'. tell-A may count as valid if there is a relative clause on its patient.
		['tell-C', { }],
	]],
]

/**
 * @typedef {(tokens: Token[], role_matches: RoleMatchResult[]) => boolean} ArgumentMatchFilter
 * @param {SenseRules} sense_rules 
 * @returns {[WordSense, ArgumentMatchFilter]}
 */
function parse_verb_sense_rule([sense, sense_rule_json]) {
	const role_filters = Object.entries(sense_rule_json).map(parse_sense_rule)
	return [sense, (tokens, role_match) => role_filters.every(filter => filter(tokens, role_match))]

	/**
	 * 
	 * @param {[RoleTag, any]} role_filter_json 
	 * @returns {ArgumentMatchFilter}
	 */
	function parse_sense_rule([role_tag, role_filter_json]) {
		const trigger = create_token_filter(role_filter_json)
		const context = create_context_filter(role_filter_json['context'])

		return (tokens, role_matches) => {
			const match_result = role_matches.find(match => match.role_tag === role_tag)
			if (!match_result) {
				return false
			}

			const index = match_result.trigger_index
			return trigger(tokens[index]) && context(tokens, index).success
		}
	}
}

/** @type {Map<WordStem, [WordSense, ArgumentMatchFilter][]>} */
const VERB_SENSE_FILTER_RULES = new Map(verb_sense_rules.map(([stem, sense_rules]) => [stem, sense_rules.map(parse_verb_sense_rule)]))

/** @type {BuiltInRule[]} */
const sense_rules = [
	{
		name: 'Verb sense selection',
		comment:'',
		rule: {
			trigger: create_token_filter({ 'category': 'Verb' }),
			context: create_context_filter({ }),
			action: (tokens, trigger_index) => {
				select_verb_sense(tokens, trigger_index)
				return trigger_index + 1
			}
		},
	},
]

export const SENSE_RULES = sense_rules.map(({ rule }) => rule)

/**
 * 
 * @param {Token[]} tokens 
 * @param {number} token_index 
 * @returns {WordSense | undefined}
 */
function find_matching_sense(tokens, token_index) {
	const token = tokens[token_index]
	const stem = token.lookup_results[0].stem
	const verb_sense_filters = VERB_SENSE_FILTER_RULES.get(stem) ?? []
	return verb_sense_filters.find(sense_matches)?.[0]

	/**
	 * 
	 * @param {[WordSense, ArgumentMatchFilter]} sense_match_filters 
	 * @returns 
	 */
	function sense_matches([sense, match_filter]) {
		const result_index = find_result_index(token, sense)
		if (result_index === -1) {
			return false
		}

		const result = token.lookup_results[result_index]
		return result.case_frame.is_valid && match_filter(tokens, result.case_frame.valid_arguments)
	}
}

/**
 * 
 * @param {Token[]} tokens
 * @param {number} verb_index
 */
function select_verb_sense(tokens, verb_index) {
	const verb_token = tokens[verb_index]
	// At this point, a token with a specified sense only has one lookup result, so can be treated normally
	// TODO after #84 check if token has specified sense (https://github.com/presciencelabs/tabitha-editor/issues/84)

	// Move the valid lookups to the top
	const valid_lookups = verb_token.lookup_results.filter(result => result.case_frame.is_valid)
	const invalid_lookups = verb_token.lookup_results.filter(result => !result.case_frame.is_valid)
	verb_token.lookup_results = [...valid_lookups, ...invalid_lookups]
	
	// Use the matching valid sense, or else the first valid sense, or else sense A.
	// The lookups should already be ordered alphabetically so the first valid sense is the lowest letter
	const sense_to_select = find_matching_sense(tokens, verb_index)
		|| `${verb_token.lookup_results[0].stem}-${valid_lookups.at(0)?.concept?.sense ?? 'A'}`
	set_token_concept(verb_token, sense_to_select)

	const selected_result = verb_token.lookup_results[0]
	if (!selected_result.case_frame.is_valid) {
		return
	}

	// apply the selected result's argument actions
	for (const valid_argument of selected_result.case_frame.valid_arguments) {
		/** @type {ArgumentRoleRule} */
		// @ts-ignore a valid argument will always have a rule associated with it
		const argument_rule = selected_result.case_frame.rule.rules.find(rule => rule.role_tag === valid_argument.role_tag)
		argument_rule.action(tokens, valid_argument)
	}
}