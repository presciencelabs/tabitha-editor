import { check_case_frames, parse_case_frame_rule, parse_sense_rules } from '../common'
import { by_adposition, by_clause_tag, by_complementizer, by_same_participant_complementizer, modified_noun_of_adjective, modified_noun_with_subgroup, unit_with_measure } from './presets'

/** @type {RoleRuleJson<AdjectiveRoleTag>} */
const default_adjective_case_frame_json = {
	'modified_noun': modified_noun_of_adjective(),
	'nominal_argument': { 'trigger': 'none' },
	'patient_clause_different_participant': by_clause_tag('patient_clause_different_participant'),
	'patient_clause_same_participant': by_clause_tag('patient_clause_same_participant'),
	'modified_noun_with_subgroup': { 'trigger': 'none' },
}

/**
 * These rules allow each adjective sense to specify rules for each argument that is different from the default.
 * Only senses that differ from the default structure need to be included here.
 * 
 * @type {Map<WordStem, [WordSense, SenseRuleJson<AdjectiveRoleTag>][]>}
 */
const adjective_case_frames = new Map([
	['afraid', [
		['afraid-B', { 'nominal_argument': by_adposition('of') }],
	]],
	['amazed', [
		['amazed-B', { 'nominal_argument': by_adposition('of|by') }],
	]],
	['angry', [
		['angry-B', { 'nominal_argument': by_adposition('at|with') }],
	]],
	['ashamed', [
		['ashamed-B', { 'nominal_argument': by_adposition('of|by') }],
	]],
	['attracted', [
		['attracted-A', { 'nominal_argument': by_adposition('to') }],
	]],
	['close', [
		['close-B', { 'nominal_argument': by_adposition('to') }],
	]],
	['content', [
		['content-A', { 'nominal_argument': by_adposition('with') }],
	]],
	['cruel', [
		['cruel-B', { 'nominal_argument': by_adposition('to') }],
	]],
	['deep', [
		['deep-A', { 'nominal_argument': unit_with_measure('length') }],
	]],
	['different', [
		['different-B', { 'nominal_argument': by_adposition('from') }],
	]],
	['each', [
		['each-A', {
			'modified_noun_with_subgroup': modified_noun_with_subgroup(),
			'other_optional': 'modified_noun_with_subgroup',
		}],
	]],
	['equal', [
		['equal-A', { 'nominal_argument': by_adposition('to') }],
	]],
	['fair', [
		['fair-A', {
			'nominal_argument': by_adposition('to'),
			'other_optional': 'nominal_argument',
			'comment': 'TODO remove the "other_optional" when the Ontology gets updated'
		}],
	]],
	['faithful', [
		['faithful-B', { 'nominal_argument': by_adposition('to') }],
		['faithful-C', { 'nominal_argument': by_adposition('with') }],
	]],
	['far', [
		['far-A', { 'nominal_argument': by_adposition('from') }],
	]],
	['few', [
		['few-A', {
			'modified_noun_with_subgroup': modified_noun_with_subgroup(),
			'other_optional': 'modified_noun_with_subgroup',
		}],
	]],
	['full', [
		['full-B', { 'nominal_argument': by_adposition('of') }],
	]],
	['gentle', [
		['gentle-B', { 'nominal_argument': by_adposition('with|to') }],
	]],
	['guilty', [
		['guilty-A', {
			'nominal_argument': by_adposition('of'),
			'other_optional': 'nominal_argument',
			'comment': 'TODO remove the "other_optional" when the Ontology gets updated'
		}],
		['guilty-B', {
			'patient_clause_same_participant': by_same_participant_complementizer('of'),
			'patient_clause_different_participant': { 'trigger': 'none' },
		}],
	]],
	['happy', [
		['happy-A', { 'nominal_argument': by_adposition('with') }],
	]],
	['hard', [
		['hard-B', {
			'nominal_argument': by_adposition('for'),
			'other_optional': 'nominal_argument',
			'comment': 'TODO remove the "other_optional" when the Ontology gets updated'
		}],
	]],
	['high', [
		['high-A', {
			'nominal_argument': unit_with_measure('length'),
			'other_optional': 'nominal_argument',
			'comment': 'TODO remove the "other_optional" when the Ontology gets updated'
		}],
	]],
	['honest', [
		['honest-A', { 'nominal_argument': by_adposition('with') }],
	]],
	['hundreds', [
		['hundreds-A', {
			'modified_noun_with_subgroup': modified_noun_with_subgroup(),
			'other_optional': 'modified_noun_with_subgroup',
			'comment': 'TODO remove when hundreds is marked as a Quantity',
		}],
	]],
	['important', [
		['important-A', { 'nominal_argument': by_adposition('to') }],
	]],
	['interested', [
		['interested-A', {
			'patient_clause_same_participant': [
				by_clause_tag('patient_clause_same_participant'),
				by_same_participant_complementizer('in'),
			],
			'patient_clause_different_participant': { 'trigger': 'none' },
		}],
	]],
	['jealous', [
		['jealous-A', { 'nominal_argument': by_adposition('of|by') }],
	]],
	['kind', [
		['kind-B', { 'nominal_argument': by_adposition('with|to') }],
	]],
	['long', [
		['long-C', { 'nominal_argument': unit_with_measure('length') }],
	]],
	['loyal', [
		['loyal-B', { 'nominal_argument': by_adposition('to') }],
	]],
	['merciful', [
		['merciful-B', { 'nominal_argument': by_adposition('to') }],
	]],
	['millions', [
		['millions-A', {
			'modified_noun_with_subgroup': modified_noun_with_subgroup(),
			'other_optional': 'modified_noun_with_subgroup',
			'comment': 'TODO remove when millions is marked as a Quantity',
		}],
	]],
	['more', [
		['more-A', {
			'modified_noun_with_subgroup': modified_noun_with_subgroup(),
			'other_optional': 'modified_noun_with_subgroup',
		}],
	]],
	['most', [
		['most-A', {
			'modified_noun_with_subgroup': modified_noun_with_subgroup(),
			'other_optional': 'modified_noun_with_subgroup',
		}],
	]],
	['old', [
		['old-B', { 'nominal_argument': unit_with_measure('time') }],
	]],
	['one', [
		['one-A', {
			'modified_noun_with_subgroup': modified_noun_with_subgroup(),
			'other_optional': 'modified_noun_with_subgroup',
		}],
	]],
	['other', [
		['other-A', {
			'modified_noun_with_subgroup': modified_noun_with_subgroup(),
			'other_optional': 'modified_noun_with_subgroup',
		}],
	]],
	['patient', [
		['patient-B', { 'nominal_argument': by_adposition('with') }],
	]],
	['pleased', [
		['pleased-A', { 'nominal_argument': by_adposition('with') }],
	]],
	['proud', [
		['proud-B', { 'nominal_argument': by_adposition('of') }],
	]],
	['ready', [
		['ready-C', {
			'patient_clause_different_participant': [
				by_clause_tag('patient_clause_different_participant'),
				by_complementizer('for'),
			],
		}],
	]],
	['responsible', [
		['responsible-A', { 'nominal_argument': by_adposition('for') }],
	]],
	['sad', [
		['sad-A', { 'nominal_argument': by_adposition('about') }],
		['sad-B', { 'nominal_argument': by_adposition('for') }],
	]],
	['satisfied', [
		['satisfied-A', {
			'nominal_argument': by_adposition('with'),
			'other_optional': 'nominal_argument',
			'comment': 'TODO remove the "other_optional" when the Ontology gets updated'
		}],
	]],
	['several', [
		['several-A', {
			'modified_noun_with_subgroup': modified_noun_with_subgroup(),
			'other_optional': 'modified_noun_with_subgroup',
			'comment': 'TODO remove when several is marked as a Quantity',
		}],
	]],
	['similar', [
		['similar-A', {
			'nominal_argument': by_adposition('to'),
			'other_optional': 'nominal_argument',
			'comment': 'TODO remove the "other_optional" when the Ontology gets updated'
		}],
	]],
	['sorry', [
		['sorry-A', {
			'patient_clause_same_participant': [
				by_same_participant_complementizer('for'),
				by_clause_tag('patient_clause_same_participant|patient_clause_different_participant'),
			],
			'patient_clause_different_participant': { 'trigger': 'none' },
			'other_optional': 'patient_clause_same_participant',
			'comment': "support 'sorry [for doing X]', 'sorry [that they did X]', and 'sorry [to do X]'. TODO remove the 'other_optional' when the Ontology gets updated",
		}],
	]],
	['surprised', [
		['surprised-A', {
			'nominal_argument': by_adposition('by'),
			'other_optional': 'nominal_argument',
			'comment': 'TODO remove the "other_optional" when the Ontology gets updated'
		}],
	]],
	['tall', [
		['tall-A', { 'nominal_argument': unit_with_measure('length') }],
	]],
	['upset', [
		['upset-B', { 'nominal_argument': by_adposition('with') }],
		['upset-C', { 'nominal_argument': by_adposition('about') }],
	]],
	['wide', [
		['wide-B', { 'nominal_argument': unit_with_measure('length') }],
	]],
	['zealous', [
		['zealous-A', { 'nominal_argument': by_adposition('for') }],
	]],
])

/**
 * @returns {ArgumentRoleRule[]}
 */
function create_default_argument_rules() {
	return Object.entries(default_adjective_case_frame_json)
		.flatMap(rule_json => parse_case_frame_rule(rule_json))
}

/**
 * @returns {Map<WordStem, ArgumentRulesForSense[]>}
 */
function create_adjective_argument_rules() {
	return new Map([...adjective_case_frames.entries()].map(create_rules_for_stem))

	/**
	 * 
	 * @param {[WordStem, [WordSense, SenseRuleJson<AdjectiveRoleTag>][]]} stem_rules 
	 * @returns {[WordStem, ArgumentRulesForSense[]]}
	 */
	function create_rules_for_stem([stem, sense_rules_json]) {
		return [stem, parse_sense_rules(sense_rules_json, DEFAULT_CASE_FRAME_RULES)]
	}
}

const DEFAULT_CASE_FRAME_RULES = create_default_argument_rules()
const ADJECTIVE_CASE_FRAME_RULES = create_adjective_argument_rules()
const SUBGROUPABLE_CASE_FRAME_RULE = parse_case_frame_rule(['modified_noun_with_subgroup', modified_noun_with_subgroup()])

/**
 * 
 * @param {RuleTriggerContext} trigger_context
 */
export function check_adjective_case_frames(trigger_context) {
	const adjective_token = trigger_context.trigger_token

	const stem = adjective_token.lookup_results[0].stem
	const argument_rules_by_sense = ADJECTIVE_CASE_FRAME_RULES.get(stem) ?? []

	check_case_frames(trigger_context, {
		rules_by_sense: argument_rules_by_sense,
		default_rule_getter: get_adjective_default_rules,
		role_info_getter: get_adjective_usage_info,
	})
}

const ADJECTIVE_LETTER_TO_ROLE = new Map([
	['A', 'modified_noun'],
	['B', 'modified_noun'],	// 'A' and 'B' are usually compatible - 'A' is attributive (the happy dog) and 'B' is a simple predicate (the dog is happy)
	['C', 'nominal_argument'],
	['D', 'patient_clause_same_participant'],
	['E', 'patient_clause_different_participant'],
])

/**
 * @param {string} categorization 
 */
function is_subgroupable_category(categorization) {
	const category = categorization[0]
	// Quantity (all), Cardinal Number (7), Fractional Number (.5)
	return ['Q', 'C', 'F'].includes(category)
}

/**
 * @param {LookupResult} lookup 
 * @returns {ArgumentRoleRule[]}
 */
function get_adjective_default_rules(lookup) {
	if (is_subgroupable_category(lookup.categorization)) {
		const subgroup_index = DEFAULT_CASE_FRAME_RULES.findIndex(({ role_tag }) => role_tag === 'modified_noun_with_subgroup')
		return DEFAULT_CASE_FRAME_RULES.with(subgroup_index, SUBGROUPABLE_CASE_FRAME_RULE[0])
	}
	
	return DEFAULT_CASE_FRAME_RULES
}

/**
 * 
 * @param {string} categorization 
 * @param {ArgumentRulesForSense} role_rules
 * @returns {RoleUsageInfo}
 */
function get_adjective_usage_info(categorization, role_rules) {
	// The first character of the categorization is the category (Generic, Quantity, Cardinal Number, etc)
	const role_letters = [...categorization.slice(1)].filter(c => c !== '_')
	
	// some categorizations are blank or erroneously all underscores (eg early-A)
	// treat all arguments as possible and not required
	if (role_letters.length === 0) {
		return {
			possible_roles: DEFAULT_CASE_FRAME_RULES.map(({ role_tag }) => role_tag),
			required_roles: [],
		}
	}

	/** @type {string[]} */
	// @ts-ignore
	const possible_roles = role_letters
		.map(c => ADJECTIVE_LETTER_TO_ROLE.get(c.toUpperCase()))
		.concat(is_subgroupable_category(categorization) ? ['modified_noun_with_subgroup'] : [])
		.concat([...role_rules.other_optional, ...role_rules.other_required])
		.filter(role => role)

	/** @type {string[]} */
	// @ts-ignore
	const required_roles = role_letters
		.map(c => ADJECTIVE_LETTER_TO_ROLE.get(c))
		.concat(role_rules.other_required)
		.filter(role => role && role !== 'modified_noun')
		// a modified noun should never be required, as usually it's possible for it to also be used predicatively

	return { possible_roles, required_roles }
}
