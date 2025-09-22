import { create_context_filter, create_token_filter } from '$lib/rules/rules_parser'

/**
 * @typedef {TokenRuleJsonBase | TokenRuleJsonBase[]} FeatureRuleJson
 * @typedef {[FeatureValue, TokenRule[]]} FeatureValueRules
 * @typedef {[FeatureName, FeatureValueRules[]]} FeatureRules
 * @typedef {Record<CategoryName, FeatureRules[]>} FeatureRulesByCategory
 */

/** @type {Record<CategoryName, [FeatureName, [FeatureValue, FeatureRuleJson][]][]>} */
const feature_rules_json = {
	'Noun': [
		['Number', [
			['Singular', { }],
			['Plural', {
				'trigger': { 'form': 'plural' },
			}],
			['Dual', {
				'context': { 'followedby': { 'token': '_dual' } },
			}],
		]],
		['Participant Tracking', [
			['Routine', { }],
			['First Mention', {
				'context': { 'precededby': { 'tag': { 'determiner': 'indefinite_article' }, 'skip': 'np_modifiers' } },
			}],
			['Generic', {
				'context': { 'followedby': { 'token': '_generic' } },
			}],
			['Frame Inferable', {
				'context': { 'followedby': { 'token': '_frameInferable' } },
			}],
			['Interrogative', [
				{ 'context': { 'precededby': { 'tag': { 'determiner': 'interrogative' }, 'skip': 'np_modifiers' } } },
				{ 'trigger': { 'tag': { 'determiner': 'interrogative' } } },
			]],
		]],
		['Polarity', [
			['Affirmative', { }],
			['Negative', {
				'context': { 'precededby': { 'tag': { 'determiner': 'negative_noun_polarity' }, 'skip': 'np_modifiers' } },
			}],
		]],
		['Proximity', [
			['Not Applicable', { }],
			['Contextually Near with Focus', {
				'context': { 'precededby': { 'tag': { 'determiner': 'near_demonstrative' }, 'skip': 'np_modifiers' } },
			}],
			['Contextually Near', {
				'context': { 'precededby': { 'tag': { 'determiner': 'remote_demonstrative' }, 'skip': 'np_modifiers' } },
			}],
		]],
		['Person', [
			['Third', { }],
			['First', {
				'trigger': { 'tag': { 'pronoun': 'first_person' } },
			}],
			['Second', {
				'trigger': { 'tag': { 'pronoun': 'second_person' } },
			}],
			['First Inclusive', {
				'trigger': { 'tag': { 'pronoun': 'first_person&plural' } },
			}],
			['First Exclusive', {
				'trigger': { 'tag': { 'pronoun': 'first_person&plural' } },
				'context': { 'followedby': { 'token': '_excl|_exclusive' } },
			}],
		]],
	],
	'Verb': [

	],
	'Adjective': [
		['Degree', [
			['No Degree', { }],
			['Comparative', [
				{ 'context': { 'precededby': { 'tag': { 'degree': 'comparative' }, 'skip': 'adjp_modifiers_predicative' } } },
				{ 'trigger': { 'form': 'comparative' } },
			]],
			['Superlative', [
				{ 'context': { 'precededby': { 'tag': { 'degree': 'superlative' }, 'skip': 'adjp_modifiers_predicative' } } },
				{ 'trigger': { 'form': 'superlative' } },
			]],
			['Intensified', {
				'context': { 'precededby': { 'tag': { 'degree': 'intensified' }, 'skip': 'adjp_modifiers_predicative' } },
			}],
			['Extremely Intensified', {
				'context': { 'precededby': { 'tag': { 'degree': 'extremely_intensified' }, 'skip': 'adjp_modifiers_predicative' } },
			}],
			["'too'", {
				'context': { 'precededby': { 'tag': { 'degree': 'too' }, 'skip': 'adjp_modifiers_predicative' } },
			}],
			["'less'", {
				'context': { 'precededby': { 'tag': { 'degree': 'less' }, 'skip': 'adjp_modifiers_predicative' } },
			}],
			["'least'", {
				'context': { 'precededby': { 'tag': { 'degree': 'least' }, 'skip': 'adjp_modifiers_predicative' } },
			}],
			['Equality', {
				'context': { 'precededby': { 'tag': { 'degree': 'equality' }, 'skip': 'adjp_modifiers_predicative' } },
			}],
		]],
	],
	'Adverb': [

	],
	'Adposition': [

	],
	'Conjunction': [

	],
	'NP': [

	],
	'VP': [

	],
	'AdjP': [

	],
	'AdvP': [

	],
	'Clause': [

	],
}

/** @type {FeatureRulesByCategory} */
const FEATURE_RULES_BY_CATEGORY = parse_all_feature_rules()

/**
 * @returns {FeatureRulesByCategory}
 */
function parse_all_feature_rules() {
	return Object.fromEntries(Object.entries(feature_rules_json).map(([pos, pos_feature_rules_json]) => {
		return [
			pos,
			pos_feature_rules_json.map(([feature_name, feature_values_json]) => {
				return [
					feature_name,
					feature_values_json.map(([feature_value, rule_json]) => {
						return [feature_value, parse_feature_rule_json(pos, feature_name, feature_value, rule_json)]
					}),
				]
			}),
		]
	}))

	/**
	 * @param {string} part_of_speech 
	 * @param {FeatureName} feature_name 
	 * @param {FeatureValue} feature_value 
	 * @param {FeatureRuleJson} rule_json 
	 * @returns {TokenRule[]}
	 */
	function parse_feature_rule_json(part_of_speech, feature_name, feature_value, rule_json) {
		if (Array.isArray(rule_json)) {
			return rule_json.flatMap(json => parse_feature_rule_json(part_of_speech, feature_name, feature_value, json))
		}

		const trigger = create_token_filter(rule_json['trigger'] || 'all')
		const context = create_context_filter(rule_json['context'])
	
		return [{
			id: `feature:${part_of_speech}:${feature_name}:${feature_value}`,
			name: '',
			trigger,
			context,
			action: ({ trigger_index }) => trigger_index + 1,	// No actual action is performed at this level
		}]
	}
}

/**
 * 
 * @param {Token[]} tokens
 * @param {number} token_index
 * @param {CategoryName} category
 * @return {EntityFeature[]}
 */
export function get_features_for_token(tokens, token_index, category) {
	const category_feature_rules = FEATURE_RULES_BY_CATEGORY[category] || []
	return category_feature_rules.map(([feature_name, feature_rules]) => {
		const selected_value_rules = feature_rules.findLast(([, rules]) => rules.some(rule => test_feature_rule(tokens, token_index, rule)))
		return {
			name: feature_name,
			value: selected_value_rules?.[0] || '',
		}
	})
}

/**
 * 
 * @param {Token[]} tokens 
 * @param {number} token_index 
 * @param {TokenRule} rule 
 */
function test_feature_rule(tokens, token_index, rule) {
	return rule.trigger(tokens[token_index]) && rule.context(tokens, token_index).success
}