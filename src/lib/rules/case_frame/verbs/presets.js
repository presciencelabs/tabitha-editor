import { TOKEN_TYPE } from '$lib/token'

/**
 * 
 * @returns {SenseRuleJson<VerbRoleTag>}
 */
export function patient_from_subordinate_clause() {
	return {
		'patient': {
			...by_clause_tag('patient_clause_different_participant'),
			'missing_message': "write 'X {stem} [Y to Verb]'",
		},
		'other_rules': {
			'extra_patient': {
				...directly_after_verb(),
				'extra_message': "{sense} should not be written with the patient. Use the format 'X {stem} [Y to Verb]'.",
			},
		},
		'comment': 'the patient is omitted in the phase 1 and copied from within the subordinate. so treat the clause like the patient',
	}
}

/**
 * 
 * @returns {SenseRuleJson<VerbRoleTag>}
 */
export function with_be_auxiliary() {
	return {
		'other_rules': {
			'be_auxiliary': {
				...by_relative_context({
					'precededby': { 'tag': { 'auxiliary': 'passive|generic' }, 'skip': 'all' },
				}),
				'context_transform': { 'tag': { 'auxiliary': 'generic' } },
				'tag_role': false,
			},
		},
		'other_optional': 'be_auxiliary',
		'comment': "some verbs look like passives but aren't eg. 'John's hand was hurt', 'John was married to Mary', etc. Leave as optional in case of 'John's hand hurt-C'",
	}
}

/**
 * 
 * @returns {SenseRuleJson<VerbRoleTag>}
 */
export function with_no_double_patient() {
	return {
		'other_rules': {
			'double_patient': {
				'trigger': { 'tag': { 'syntax': 'head_np' } },
				'context': { 'precededby': { 'tag': { 'syntax': 'head_np' }, 'skip': 'np_modifiers' } },
				'extra_message': "'{stem}' requires the patient to immediately follow the Verb. Make sure to use 'to X' for the destination.",
			},
		},
	}
}

/**
 * 
 * @param {string} adposition 
 * @returns {CaseFrameRuleJson}
 */
export function by_adposition(adposition) {
	return {
		'trigger': { 'tag': { 'syntax': 'head_np' } },
		'context': { 'precededby': { 'token': adposition, 'skip': 'np_modifiers' } },
		'context_transform': { 'function': { 'pre_np_adposition': 'verb_argument' } },
		'missing_message': `'${adposition} X'`,
	}
}

/**
 * Different from by_adposition() in that the adposition remains a lexical concept as opposed to becoming a function word.
 * @param {string} adposition
 * @returns {RoleRuleValueJson}
 */
export function by_adposition_concept(adposition='') {
	if (adposition) {
		// If specific adpositions are provided, filter by those only.
		return {
			'trigger': { 'tag': { 'syntax': 'head_np' } },
			'context': {
				'precededby': [
					{ 'category': 'Verb', 'skip': 'all' },
					{ 'token': adposition, 'skip': 'np_modifiers' },
				],
			},
			'context_transform': [{}, { 'tag': { 'pre_np_adposition': 'verb_argument' } }],
		}
	} else {
		// Filter for any 'Adposition', and allow the possibility of 'to'
		return [
			by_adposition('to'), // 'to' is also valid, but does not have a concept associated with it
			{
				'trigger': { 'tag': { 'syntax': 'head_np' } },
				'context': {
					'precededby': [
						{ 'category': 'Verb', 'skip': 'all' },
						{ 'category': 'Adposition', 'skip': 'np_modifiers' },
					],
					'notprecededby' : { 'token': 'with|for', 'skip': 'np_modifiers' },
				},
				'context_transform': [{}, { 'tag': { 'pre_np_adposition': 'verb_argument' } }],
				'comment': 'Could have any adposition except with/for (eg "in Egypt", "along the Nile", "by the river", etc)',
			},
		]
	}
}

/**
 * 
 * @param {string} clause_type 
 * @returns {CaseFrameRuleJson}
 */
export function by_clause_tag(clause_type) {
	return {
		'trigger': { 'type': TOKEN_TYPE.CLAUSE, 'tag': { 'clause_type': clause_type, 'role': 'none' } },
	}
}

/**
 * 
 * @param {string} complementizer 
 * @returns {CaseFrameRuleJson}
 */
export function by_complementizer(complementizer) {
	return {
		'trigger': { 'type': TOKEN_TYPE.CLAUSE, 'tag': { 'clause_type': 'adverbial_clause|patient_clause_different_participant' } },
		'context': {
			'subtokens': { 'token': complementizer, 'skip': 'clause_start' },
		},
		'transform': { 'tag': { 'clause_type': 'patient_clause_different_participant', 'role': 'patient_clause_different_participant' } },
		'subtoken_transform': { 'function': { 'syntax': 'complementizer' } },
		'missing_message': `'[${complementizer} ...]'`,
	}
}

/**
 * 
 * @param {TokenFilterJsonBase} token_filter 
 * @returns {CaseFrameRuleJson}
 */
export function directly_before_verb(token_filter={}) {
	return by_relative_context({
		'precededby': {
			'tag': { 'syntax': 'head_np' },
			'skip': ['np', 'vp_modifiers'], // skip 'np' because there might be a genitive (eg 'man of God')
			...token_filter,
		},
	})
}

/**
 * 
 * @param {TokenFilterJsonBase} token_filter 
 * @returns {CaseFrameRuleJson}
 */
export function directly_after_verb(token_filter={}) {
	return by_relative_context({
		'followedby': {
			'tag': { 'syntax': 'head_np' },
			'skip': ['vp_modifiers', 'np_modifiers'],
			...token_filter,
		},
	})
}

/**
 * 
 * @param {string} adposition 
 * @returns {CaseFrameRuleJson}
 */
export function directly_after_verb_with_adposition(adposition) {
	return {
		...by_relative_context({
			'followedby': [
				{ 'token': adposition, 'skip': 'vp_modifiers' },
				{ 'tag': { 'syntax': 'head_np' }, 'skip': 'np_modifiers' },
			],
		}),
		'argument_context_index': 1,
		'context_transform': { 'function': { 'pre_np_adposition': 'verb_argument' } },	// make the adposition a function word
		'missing_message': `'${adposition} X'`,
	}
}

/**
 * 
 * @returns {CaseFrameRuleJson}
 */
export function predicate_adjective() {
	return by_relative_context({
		'followedby': {
			'category': 'Adjective',
			'tag': { 'adj_usage': 'predicative' },
			'skip': 'all',
		},
	})
}

/**
 * 
 * @param {TokenContextFilterJson} relative_context 
 * @returns {CaseFrameRuleJson}
 */
export function by_relative_context(relative_context) {
	return {
		'trigger': 'all',
		'context': relative_context,
		'argument_context_index': 0,
	}
}