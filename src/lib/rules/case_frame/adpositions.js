import { check_case_frames, parse_case_frame_rule, parse_sense_rules } from './common'

const default_adposition_usage_json = {
	'opening_subordinate_clause': { 'opening_subordinate_clause': { } },
	'in_noun_phrase': { 'head_noun': { } },
}

/** @type {RoleRulePreset[]} */
// @ts-ignore the map initializer array doesn't like the different object structures
const ROLE_RULE_PRESETS = [
	['opening_subordinate_clause', () => ({
		'by_relative_context': {
			'precededby': { 'token': '[', 'skip': { 'tag': 'coord_clause' } },
		},
		'tag_role': false,
		'main_word_tag': { 'syntax': 'adverbial_clause_adposition' },
		'missing_message': "Missing '[' bracket before adverbial clause.",
	})],
	['head_noun', () => ({
		'by_relative_context': {
			'followedby': { 'tag': { 'syntax': 'head_np' }, 'skip': 'np_modifiers' },
		},
		'tag_role': false,
		'main_word_tag': { 'pre_np_adposition': 'oblique' },
		'missing_message': 'Could not find the Noun associated with this Adposition.',
	})],
	['by_relative_context', preset_value => ({
		'trigger': 'all',
		'context': preset_value,
		'argument_context_index': preset_value['argument_context_index'] ?? 0,
	})],
]

/**
 * These rules allow each adposition sense to specify rules for each argument that is different from the default.
 * Only senses that differ from the default structure need to be included here.
 * 
 * @type {Map<WordStem, [WordSense, any][]>}
 */
const adposition_case_frames = new Map([
	['because', [
		['because-B', {
			'opening_subordinate_clause': { },
			'other_rules': {
				'of': {
					'by_relative_context': {
						'followedby': { 'token': 'of' },
					},
					'transform': { 'tag': { 'pre_np_adposition': 'oblique' }, 'remove_tag': 'relation' },
					'tag_role': false,
				},
			},
			'other_optional': 'of',
		}],
	]],
	['so', [
		['so-A', {
			'in_noun_phrase': { },
			'other_rules': {
				'could': {
					'by_relative_context': {
						'followedby': { 'tag': { 'modal': 'conditional_could' }, 'skip': 'all' },
					},
					'tag_role': false,
				},
			},
			'other_optional': 'could',
		}],
		['so-C', {
			'in_noun_phrase': { },
			'other_rules': {
				'would': {
					'by_relative_context': {
						'followedby': { 'tag': { 'modal': 'conditional_would' }, 'skip': 'all' },
					},
					'tag_role': false,
				},
			},
			'other_required': 'would',
		}],
	]],
])

/**
 * @returns {ArgumentRoleRule[]}
 */
function create_usage_rules() {
	return Object.entries(default_adposition_usage_json)
		.flatMap(rule_json => parse_case_frame_rule(rule_json, ROLE_RULE_PRESETS))
}

/**
 * @returns {Map<WordStem, ArgumentRulesForSense[]>}
 */
function create_adposition_argument_rules() {
	return new Map([...adposition_case_frames.entries()].map(create_rules_for_stem))

	/**
	 * 
	 * @param {[WordStem, [WordSense, any][]]} stem_rules 
	 * @returns {[WordStem, ArgumentRulesForSense[]]}
	 */
	function create_rules_for_stem([stem, sense_rules_json]) {
		const presets = { role_presets: ROLE_RULE_PRESETS }
		return [stem, parse_sense_rules(sense_rules_json, DEFAULT_USAGE_RULES, presets)]
	}
}

const DEFAULT_USAGE_RULES = create_usage_rules()
const ADPOSITION_USAGE_RULES = create_adposition_argument_rules()

/**
 * 
 * @param {RuleTriggerContext} trigger_context
 */
export function check_adposition_case_frames(trigger_context) {
	const adposition_token = trigger_context.trigger_token

	const stem = adposition_token.lookup_results[0].stem
	const argument_rules_by_sense = ADPOSITION_USAGE_RULES.get(stem) ?? []

	check_case_frames(trigger_context, {
		rules_by_sense: argument_rules_by_sense,
		default_rule_getter: get_default_usage_rules,
		role_info_getter: get_adposition_usage_info,
	})
}

/**
 * 
 * @param {LookupResult} lookup 
 */
function get_default_usage_rules(lookup) {
	const roles = convert_usage_info(lookup.categorization)

	// No adposition has more than one usage value
	const matching_rule = DEFAULT_USAGE_RULES.find(rule => roles.includes(rule.role_tag))
	return matching_rule ? [matching_rule] : []
}

const ADPOSITION_LETTER_TO_ROLE = new Map([
	['A', 'in_noun_phrase'],
	['B', 'in_noun_phrase'],
	['C', 'opening_subordinate_clause'],
])

/**
 * 
 * @param {string} categorization 
 * @param {ArgumentRulesForSense} role_rules
 * @returns {RoleUsageInfo}
 */
function get_adposition_usage_info(categorization, role_rules) {
	const usage_roles = convert_usage_info(categorization)

	const all_roles = usage_roles.concat(role_rules.other_optional).concat(role_rules.other_required)
	
	// some categorizations are blank or erroneously all underscores (eg early-A)
	// treat all arguments as possible and not required
	if (all_roles.length === 0) {
		return {
			possible_roles: [...ADPOSITION_LETTER_TO_ROLE.values()],
			required_roles: [],
		}
	}

	return {
		possible_roles: all_roles,
		required_roles: usage_roles.concat(role_rules.other_required),
	}
}

/**
 * 
 * @param {string} categorization 
 */
function convert_usage_info(categorization) {
	const role_letters = [...categorization].filter(c => c !== '_')

	/** @type {string[]} */
	// @ts-ignore
	const roles = role_letters
		.map(c => ADPOSITION_LETTER_TO_ROLE.get(c))
		.filter(role => role)

	return roles
}