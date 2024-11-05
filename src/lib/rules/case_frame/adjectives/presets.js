import { TOKEN_TYPE } from '$lib/token'

/**
 * 
 * @returns {SenseRuleJson<AdjectiveRoleTag>}
 */
export function subgroup_with_optional_of() {
	return {
		'modified_noun': [
			modified_noun_of_adjective(),
			{
				...by_relative_context({
					'followedby': [
						{ 'token': 'of' },
						{ 'tag': { 'syntax': 'head_np' }, 'skip': 'np_modifiers' },
					],
				}),
				'argument_context_index': 1,
				'context_transform': { 'function': { 'relation': 'subgroup' }, 'remove_tag': 'pre_np_adposition' },
				'main_word_tag': { 'adj_usage': 'attributive', 'adj_type': 'subgroup' },
				'tag_role': false,
			},
		],
		'comment': "eg 'all X' and 'all of X' are both supported",
	}
}

/**
 * 
 * @param {string} adposition 
 * @returns {CaseFrameRuleJson}
 */
export function by_adposition(adposition) {
	return {
		...by_relative_context({
			'followedby': [
				{ 'token': adposition },
				{ 'tag': { 'syntax': 'head_np' }, 'skip': 'np_modifiers' },
			],
		}),
		'argument_context_index': 1,
		'transform': { 'tag': { 'role': 'adjective_nominal_argument', 'syntax': 'nested_np' } },
		'context_transform': { 'function': { 'pre_np_adposition': 'adjective_argument', 'relation': '' } },	// make the adposition a function word and clear other tag values
		'missing_message': `Couldn't find the nominal argument, which in this case should have '${adposition}' before it.`,
	}
}

/**
 * 
 * @param {string} clause_type 
 * @returns {CaseFrameRuleJson}
 */
export function by_clause_tag(clause_type) {
	return {
		...by_relative_context({
			'followedby': { 'type': TOKEN_TYPE.CLAUSE, 'tag': { 'clause_type': clause_type, 'role': 'none' } },
		}),
		'transform': { 'tag': { 'role': 'adjective_clausal_argument' } },
		'comment': 'the clause should immediately follow the adjective',	// TODO is this true?
	}
}

/**
 * 
 * @returns {CaseFrameRuleJson}
 */
export function modified_noun_of_adjective() { 
	return {
		...by_relative_context({
			'followedby': { 'category': 'Noun', 'skip': 'np_modifiers' },
			'notfollowedby': { 'token': 'of' },
		}),
		'tag_role': false,
		'main_word_tag': { 'adj_usage': 'attributive', 'adj_type': 'regular' },
		'comment': '"of" is a relation that can be part of an NP, but is also used for some nominal arguments and should not be skipped if it immediately follows the Adj (eg. John was afraid of Mary)',
	}
}

/**
 * 
 * @param {string} unit_type 
 * @returns {CaseFrameRuleJson}
 */
export function unit_with_measure(unit_type) {
	return {
		...by_relative_context({
			'precededby': { 'category': 'Noun' },
		}),
		'transform': { 'tag': { 'role': 'adjective_nominal_argument', 'syntax': 'nested_np' } },
		'main_word_tag': { 'adj_type': 'measure' },
		'missing_message': `{sense} must be in the format 'N X {stem}' where N is a number/quantity and X is a unit of ${unit_type}.`,
	}
}

/**
 * 
 * @param {TokenContextFilterJson} relative_context 
 * @returns {CaseFrameRuleJson}
 */
function by_relative_context(relative_context) {
	return {
		'trigger': 'all',
		'context': relative_context,
		'argument_context_index': 0,
	}
}