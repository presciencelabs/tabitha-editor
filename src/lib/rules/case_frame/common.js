import { LOOKUP_FILTERS } from '$lib/lookup_filters'
import { TOKEN_TYPE, stem_with_sense, create_case_frame, create_token, format_token_message } from '$lib/token'
import { parse_transform_rule } from '../transform_rules'

/**
 * 
 * @param {RoleTag} role_tag 
 * @returns {string}
 */
function readable_role_tag(role_tag) {
	const readables = new Map([
		// verb arguments
		['patient_clause_quote_begin', 'open-quote patient clause'],
		['patient_clause_simultaneous', '"-ing" patient clause'],
		// verb/adjective arguments
		['patient_clause_same_participant', 'same-participant patient clause'],
		['patient_clause_different_participant', 'different-participant patient clause'],
		// adposition arguments
		['opening_subordinate_clause', "opening '[' bracket"],
		['in_noun_phrase', 'head noun'],
	])
	return readables.get(role_tag) ?? role_tag.replace('_', ' ')
}

/**
 * 
 * @param {RoleTag} role_tag 
 * @returns {string}
 */
function missing_argument_message(role_tag) {
	const messages = new Map([
		['agent_clause', "'It {stem} [X...]' or '[X...] {stem}...'"],
		['patient_clause_different_participant', 'explicit subject'],
		['patient_clause_same_participant', "'[to Verb]'"],
		['patient_clause_simultaneous', "'{token} [X Verb-ing]'"],
	])
	return messages.get(role_tag) ?? ''
}

/**
 * @param {RoleTag} role_tag 
 * @returns {string}
 */
function extra_argument_message(role_tag) {
	const consult_message = "Consult the {category}'s Theta Grid usage."
	const messages = new Map([
		['patient', `Unexpected {role} for {sense}. ${consult_message}`],
		['source', `Unexpected {role} for {sense}. ${consult_message}`],
		['destination', `Unexpected {role} for {sense}. ${consult_message}`],
		['beneficiary', '{sense} does not usually take a {role}. Check to make sure its usage is acceptable.'],
		['instrument', '{sense} does not usually take a {role}. Check to make sure its usage is acceptable.'],
		['agent_clause', `{sense} cannot be used with an agent clause. ${consult_message}`],
		['patient_clause_different_participant', `{sense} cannot be used with a different-participant patient clause. ${consult_message}`],
		['patient_clause_same_participant', `{sense} cannot be used with a same-participant patient clause. ${consult_message}`],
		['patient_clause_simultaneous', `{sense} cannot be used with a simultaneous perception clause. ${consult_message}`],
		['patient_clause_quote_begin', `{sense} cannot be used with direct speech. ${consult_message}`],
		['predicate_adjective', `{sense} cannot be used with a predicate Adjective. ${consult_message}`],
		['modified_noun', `{sense} cannot be used attributively. ${consult_message}`],
	])
	return messages.get(role_tag) ?? 'Unexpected {role} for {sense}. Consult its usage in the Ontology.'
}

/** @type {Map<RoleTag, string>} */
const ALL_HAVE_EXTRA_ARGUMENT_MESSAGES = new Map([
	['patient_clause_same_participant', "'{stem}' cannot be used with a same-participant patient clause. This likely should be '[in-order-to...]' or '[so-that...]' instead."],
	['patient_clause_quote_begin', "'{stem}' can never be used with direct speech. Consult its usage in the Ontology."],
	['predicate_adjective', "'{stem}' can never be used with a predicate adjective. Consider using something like 'cause [X to be...]'. Consult its usage in the Ontology."],
])

/**
 * 
 * @param {WordSense} sense 
 * @param {RoleTag} role_tag 
 * @param {RoleRuleValueJson} rule_json 
 * @returns {ArgumentRoleRule[]}
 */
export function parse_case_frame_rule(sense, role_tag, rule_json) {
	if (Array.isArray(rule_json)) {
		// An argument role may have multiple possible trigger rules, ie different structures that are allowed.
		return rule_json.flatMap(rule_option => parse_case_frame_rule(sense, role_tag, rule_option))
	}

	const tag_role = rule_json['tag_role'] ?? true
	const tag_transform = tag_role ? { 'tag': { 'role': role_tag } } : {}

	rule_json['transform'] = { ...tag_transform, ...rule_json['transform'] ?? {} }

	const missing_message = rule_json['missing_message'] ?? missing_argument_message(role_tag)
	const extra_message = rule_json['extra_message'] ?? extra_argument_message(role_tag)

	return [{
		role_tag,
		trigger_rule: { ...parse_transform_rule(rule_json, 0), id: `case_frame:${sense}:${role_tag}` },
		relative_context_index: rule_json['argument_context_index'] ?? -1,
		missing_message: missing_message.replaceAll('{role}', role_tag),
		extra_message: extra_message.replaceAll('{role}', role_tag),
		main_word_tag: rule_json['main_word_tag'] ?? null,
	}]
}

/**
 * @param {[WordSense, any][]} rule_json
 * @param {ArgumentRoleRule[]} defaults
 * @returns {ArgumentRulesForSense[]}
 */
export function parse_sense_rules(rule_json, defaults) {
	return rule_json.map(parse_sense_rule(defaults))

	/**
	 * 
	 * @param {ArgumentRoleRule[]} defaults
	 * @returns {(rule_json: [WordSense, any]) => ArgumentRulesForSense}
	 */
	function parse_sense_rule(defaults) {
		return ([sense, rules_json]) => {
			const role_rules = defaults.flatMap(rule => rule.role_tag in rules_json
				? parse_case_frame_rule(sense, rule.role_tag, rules_json[rule.role_tag])
				: [rule])

			const other_rules = 'other_rules' in rules_json
				? Object.entries(rules_json['other_rules'])
					.flatMap(([other_tag, other_rule_json]) => parse_case_frame_rule(sense, other_tag, other_rule_json))
				: []

			return {
				sense,
				role_rules: role_rules.concat(other_rules),
				other_optional: rules_json['other_optional']?.split('|') ?? [],
				other_required: rules_json['other_required']?.split('|') ?? [],
				patient_clause_type: rules_json['patient_clause_type'] ?? '',
			}
		}
	}
}

/**
 * @param {RuleTriggerContext} trigger_context
 * @param {(token: Token) => CaseFrameRuleInfo} rule_info_getter
 */
export function initialize_case_frame_rules({ trigger_token }, rule_info_getter) {
	initialize_rules(trigger_token)
	if (trigger_token.pairing) {
		initialize_rules(trigger_token.pairing)
	}

	/**
	 * @param {Token} token 
	 */
	function initialize_rules(token) {
		if (token.lookup_results.length === 0) {
			return
		}
		const { rules_by_sense, default_rule_getter, role_info_getter, should_check } = rule_info_getter(token)
		if (!should_check) {
			return
		}
		for (const lookup of token.lookup_results.filter(LOOKUP_FILTERS.IS_IN_ONTOLOGY)) {
			const rules_for_sense = get_rules_for_sense(rules_by_sense, default_rule_getter)(lookup)
			lookup.case_frame = {
				rules: rules_for_sense.role_rules,
				usage: role_info_getter(lookup.categorization, rules_for_sense),
				result: create_case_frame(),
			}
		}
	}
}

/**
 * @param {RuleTriggerContext} trigger_context
 */
export function check_case_frames(trigger_context) {
	const lookups_to_check = trigger_context.trigger_token.lookup_results
		.filter(LOOKUP_FILTERS.IS_IN_ONTOLOGY)
		.filter(lookup => lookup.case_frame?.rules.length > 0)

	for (const lookup of lookups_to_check) {
		const match_results = match_sense_rules(trigger_context, lookup)
		lookup.case_frame.result = check_usage(lookup, match_results)
	}
}

/**
 * @param {RuleTriggerContext} trigger_context
 */
export function check_pairing_case_frames({ trigger_token }) {
	// check the usage of the complex pairing against the matched arguments of the selected result
	const selected_result = trigger_token.lookup_results[0]
	const lookups_to_check = trigger_token.pairing?.lookup_results
		.filter(LOOKUP_FILTERS.IS_IN_ONTOLOGY)
		.filter(lookup => lookup.case_frame?.rules.length > 0)
		?? []

	for (const lookup of lookups_to_check) {
		lookup.case_frame.result = check_usage(lookup, selected_result.case_frame.result.valid_arguments)
	}
}

/**
 * 
 * @param {ArgumentRulesForSense[]} rules_by_sense 
 * @param {DefaultRuleGetter} default_rule_getter
 * @returns {(lookup: LookupResult) => ArgumentRulesForSense}
 */
function get_rules_for_sense(rules_by_sense, default_rule_getter) {
	/** @type {ArgumentRulesForSense} */
	return lookup => {
		const defaults_for_stem = {
			sense: '',
			role_rules: default_rule_getter(lookup),
			other_optional: [],
			other_required: [],
			patient_clause_type: '',
		}

		const sense = stem_with_sense(lookup)
		return rules_by_sense.find(rule => rule.sense === sense) ?? { ...defaults_for_stem, sense }
	}
}

/**
 * 
 * @param {RuleTriggerContext} main_trigger_context 
 * @param {LookupResult} lookup 
 * @returns {RoleMatchResult[]}
 */
function match_sense_rules(main_trigger_context, lookup) {
	return lookup.case_frame.rules
		.map(rule => match_argument_rule(main_trigger_context, rule))
		.filter(match => match.success)
}

/**
 * 
 * @param {RuleTriggerContext} main_trigger_context 
 * @param {ArgumentRoleRule} rule 
 * @returns {RoleMatchResult}
 */
function match_argument_rule(main_trigger_context, rule) {
	const { tokens } = main_trigger_context
	const { trigger, context } = rule.trigger_rule

	if (rule.relative_context_index >= 0) {
		// The rule should be interpreted as relative to the main word
		const context_result = context(tokens, main_trigger_context.trigger_index)

		if (!context_result.success) {
			return create_role_match_result(rule, false)
		}

		const argument_index = context_result.context_indexes[rule.relative_context_index]

		return create_role_match_result(rule, true, {
			tokens,
			trigger_index: argument_index,
			trigger_token: tokens[argument_index],
			rule_id: rule.trigger_rule.id,
			...context_result,
		})

	} else {
		// The rule stands alone within the clause, not relative to the main word
		for (let i = 0; i < tokens.length;) {
			if (!trigger(tokens[i])) {
				i++
				continue
			}
			const context_result = context(tokens, i)
			if (!context_result.success) {
				i++
				continue
			}

			return create_role_match_result(rule, true, {
				tokens,
				trigger_index: i,
				trigger_token: tokens[i],
				rule_id: rule.trigger_rule.id,
				...context_result,
			})
		}

		return create_role_match_result(rule, false)
	}
}

/**
 * 
 * @param {ArgumentRoleRule} rule 
 * @param {boolean} success 
 * @param {RuleTriggerContext?} argument_context 
 * @returns {RoleMatchResult}
 */
function create_role_match_result(rule, success, argument_context=null) {
	return {
		role_tag: rule.role_tag,
		success,
		trigger_context: argument_context ?? {
			tokens: [],
			trigger_index: -1,
			trigger_token: create_token('', TOKEN_TYPE.NOTE),
			context_indexes: [],
			subtoken_indexes: [],
			rule_id: rule.trigger_rule.id,
		},
		rule,
	}
}

/**
 * @param {LookupResult} lookup
 * @param {RoleMatchResult[]} role_matches 
 * @returns {CaseFrameResult}
 */
function check_usage(lookup, role_matches) {
	if (lookup.ontology_status !== 'present') {
		return create_case_frame()
	}

	const { possible_roles, required_roles } = lookup.case_frame.usage

	// Sometimes the same token matches multiple roles, especially with clauses. So if an 'extra' argument
	// also matched a valid argument, remove it from the extras.

	const valid_arguments = role_matches.filter(({ role_tag }) => possible_roles.includes(role_tag))
	const extra_arguments = role_matches.filter(({ role_tag, trigger_context }) => 
		!possible_roles.includes(role_tag)
		&& !valid_arguments.some(({ trigger_context: { trigger_index} }) => trigger_context.trigger_index === trigger_index))
	const missing_arguments = required_roles.filter(role => !role_matches.some(({ role_tag }) => role_tag === role))

	const is_valid = extra_arguments.length === 0 && missing_arguments.length === 0

	return create_case_frame({
		status: is_valid ? 'valid' : 'invalid',
		valid_arguments,
		missing_arguments,
		extra_arguments,
	})
}

/**
 * 
 * @param {RuleTriggerContext} trigger_context
 */
export function* validate_case_frame(trigger_context) {
	const token = trigger_context.trigger_token

	// If nothing was checked, nothing to validate
	if (token.lookup_results.every(lookup => lookup.case_frame.result.status === 'unchecked')) {
		return
	}
	
	const selected_result = token.lookup_results[0]
	const sense = stem_with_sense(selected_result)
	const case_frame = selected_result.case_frame.result

	if (no_matches_and_ambiguous_sense(token)) {
		yield { error: "This use of '{stem}' does not match any sense in the Ontology. Check other errors and warnings for more information." }

		// flag any extra roles common to all lookup results
		const extra_roles_for_all = selected_result.case_frame.result.extra_arguments.filter(({ role_tag }) => role_is_extra_for_all(role_tag, token))
		for (const extra_argument of extra_roles_for_all) {
			const extra_message = ALL_HAVE_EXTRA_ARGUMENT_MESSAGES.get(extra_argument.role_tag)
				|| extra_argument.rule.extra_message.replaceAll('{sense}', "'{stem}'")
			// put the error message on both the trigger token AND the argument token
			yield { error: extra_message }
			yield flag_extra_argument(trigger_context, extra_argument, extra_message)
		}

		// show the invalid arguments for each lookup result
		for (const result of token.lookup_results) {
			yield show_invalid_roles(result)
		}

	} else if (case_frame.status === 'invalid') {
		yield { error: 'Incorrect usage of {sense}. Check other errors and warnings for more information, and consult the Ontology.' }
		yield show_invalid_roles(selected_result)
		
		for (const extra_argument of case_frame.extra_arguments) {
			yield flag_extra_argument(trigger_context, extra_argument, extra_argument.rule.extra_message)
		}
	}

	// Warn if a beneficiary or instrument is present, but not included in the theta grid
	// This is not necessarily an error, as many verbs could technically take them.
	// Sometimes they just haven't occurred yet for a sense and so don't appear in the Verb categorization.
	const roles_to_check = [
		['instrument', 'F'],
		['beneficiary', 'G'],
	]
	for (const [role_tag, categorization_letter] of roles_to_check) {
		const role_argument = case_frame.valid_arguments.find(({ role_tag: tag }) => tag === role_tag)
		if (role_argument && !selected_result.categorization.toUpperCase().includes(categorization_letter)) {
			yield {
				token_to_flag: role_argument.trigger_context.trigger_token,
				warning: `${sense} does not usually take a ${role_tag}. Check to make sure its usage is acceptable.`,
			}
		}
	}

	// Flag a pairing that is invalid
	// If the base word is invalid, there's no point checking the pairing
	const pairing_token = token.pairing
	if (case_frame.status === 'valid' && pairing_token && pairing_token.lookup_results.some(({ case_frame }) => case_frame.result.status === 'invalid')) {
		const selected_pairing_result = pairing_token.lookup_results[0]
		const simple_sense = stem_with_sense(selected_result)
		if (no_matches_and_ambiguous_sense(pairing_token)) {
			yield {
				token_to_flag: pairing_token,
				error: `'{stem}' may not be compatible with this usage of ${simple_sense}.`,
			}

			// show the invalid arguments for each lookup result
			for (const result of pairing_token.lookup_results) {
				yield { token_to_flag: pairing_token, ...show_invalid_roles(result) }
			}

		} else if (selected_pairing_result.case_frame.result.status === 'invalid') {
			yield {
				token_to_flag: pairing_token,
				error: `{sense} may not be compatible with this usage of ${simple_sense}.`,
			}
			yield { token_to_flag: pairing_token, ...show_invalid_roles(selected_pairing_result) }
		}
	}
}

/**
 * @param {LookupResult} lookup 
 * @returns {MessageInfo}
 */
function show_invalid_roles(lookup) {
	/**
	 * @param {RoleTag} role_tag
	 */
	function get_missing_messages(role_tag) {
		const missing_message = lookup.case_frame.rules.find(rule => rule.role_tag === role_tag)?.missing_message ?? ''
		if (missing_message.length) {
			return `${readable_role_tag(role_tag)} (${missing_message})`
		}
		return readable_role_tag(role_tag)
	}
	const missing_roles = lookup.case_frame.result.missing_arguments.map(get_missing_messages)
	const missing_message = missing_roles.length ? `missing ${missing_roles.join(', ')}` : ''

	const extra_roles = lookup.case_frame.result.extra_arguments.map(({ role_tag }) => readable_role_tag(role_tag))
	const extra_message = extra_roles.length ? `unexpected ${extra_roles.join(', ')}` : ''

	const joiner = missing_message.length && extra_message.length ? '; ' : ''
	
	return { info: `${stem_with_sense(lookup)}: ${missing_message}${joiner}${extra_message}` }
}

/**
 * 
 * @param {Token} token 
 * @returns {boolean}
 */
function no_matches_and_ambiguous_sense(token) {
	return token.lookup_results.every(({ case_frame }) => case_frame.result.status === 'invalid') && token.lookup_results.length > 1 && !token.specified_sense
}

/**
 * 
 * @param {RoleTag} role_tag 
 * @param {Token} token 
 * @returns {boolean}
 */
function role_is_extra_for_all(role_tag, token) {
	return token.lookup_results.every(LOOKUP_FILTERS.HAS_EXTRA_ARGUMENT(role_tag))
}

/**
 * 
 * @param {RuleTriggerContext} trigger_context 
 * @param {RoleMatchResult} extra_argument 
 * @param {string} message
 * @returns {MessageInfo}
 */
function flag_extra_argument(trigger_context, extra_argument, message) {
	// The message is formatted based on the verb trigger token, not the argument token
	const formatted_message = format_token_message(trigger_context, message)

	const argument_token = extra_argument.trigger_context.trigger_token
	const token_to_flag = argument_token.type === TOKEN_TYPE.CLAUSE ? argument_token.sub_tokens[0] : argument_token
	return { token_to_flag, error: formatted_message, plain: true }
}
