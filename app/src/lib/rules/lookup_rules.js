import { apply_token_transforms, create_context_filter, create_token_filter, create_token_transforms } from '$lib/rules/rules_parser'
import { TOKEN_TYPE } from '../parser/token'

/**
 * These words/phrases (and some others) are accepted by the Analyzer as alternates for
 * certain words in the Ontology.
 */
const lookup_rules_json = [
	{
		'name': 'in-order-to',
		'trigger': { 'token': 'in' },
		'context': { 'followedby': [{ 'token': 'order' }, { 'token': 'to' }] },
		'lookup': 'in-order-to',
		'combine': 2,
	},
	{
		'name': 'in-front-of',
		'trigger': { 'token': 'in' },
		'context': { 'followedby': [{ 'token': 'front' }, { 'token': 'of' }] },
		'lookup': 'in-front-of',
		'combine': 2,
	},
	{
		'name': 'so-that becomes so for lookup purposes',
		'trigger': { 'token': 'so-that' },
		'lookup': 'so',
	},
	{
		'name': 'just-like',
		'trigger': { 'token': 'just' },
		'context': { 'followedby': { 'token': 'like' } },
		'lookup': 'just-like',
		'combine': 1,
	},
	{
		'name': 'even-if',
		'trigger': { 'token': 'Even|even' },
		'context': { 'followedby': { 'token': 'if' } },
		'lookup': 'even-if',
		'combine': 1,
	},
	{
		'name': 'much becomes much-many if followed by a Noun',
		'trigger': { 'token': 'Much|much' },
		'context': { 'followedby': { 'category': 'Noun' } },
		'lookup': 'much-many',
		'comment': 'something like "There is much water"',
	},
	{
		'name': 'many becomes much-many',
		'trigger': { 'token': 'Many|many' },
		'lookup': 'much-many',
	},
	{
		'name': 'every becomes each',
		'trigger': { 'token': 'Every|every' },
		'lookup': 'each',
	},
	{
		'name': 'half becomes .5',
		'trigger': { 'token': 'half' },
		'lookup': '.5',
	},
	{
		'name': 'one tenth of',
		'trigger': { 'token': 'One|one' },
		'context': { 'followedby': [{ 'token': 'tenth' }, { 'token': 'of' }] },
		'lookup': '.1',
		'combine': 2,
	},
	{
		'name': 'because of becomes because-B',
		'trigger': { 'token': 'because' },
		'context': { 'followedby': { 'token': 'of' } },
		'lookup': 'because-B',
		'combine': 1,
	},
	{
		'name': 'give birth',
		'trigger': { 'stem': 'give' },
		'context': { 'followedby': { 'token': 'birth' } },
		'lookup': 'birth',
		'combine': 1,
	},
	{
		'name': 'grow up',
		'trigger': { 'stem': 'grow' },
		'context': { 'followedby': { 'token': 'up' } },
		'lookup': 'grow-B',
		'combine': 1,
	},
	{
		'name': 'laugh at',
		'trigger': { 'stem': 'laugh' },
		'context': { 'followedby': { 'token': 'at' } },
		'lookup': 'laugh-B',		// TODO make this a case frame rule
		'context_transform': { 'type': TOKEN_TYPE.FUNCTION_WORD },
	},
	{
		'name': 'lift up',
		'trigger': { 'stem': 'lift' },
		'context': { 'followedby': { 'token': 'up', 'skip': 'all' } },
		'lookup': 'lift',
		'context_transform': { 'type': TOKEN_TYPE.FUNCTION_WORD },
	},
	{
		'name': 'look at',
		'trigger': { 'stem': 'look' },
		'context': { 'followedby': { 'token': 'at' } },
		'lookup': 'look-A',		// TODO make this a case frame rule
		'context_transform': { 'type': TOKEN_TYPE.FUNCTION_WORD },
	},
	{
		'name': 'look for -> search',
		'trigger': { 'stem': 'look' },
		'context': { 'followedby': { 'token': 'for' } },
		'lookup': 'search',
		'context_transform': { 'type': TOKEN_TYPE.FUNCTION_WORD },
	},
	{
		'name': 'look like -> appear-B',
		'trigger': { 'stem': 'look' },
		'context': { 'followedby': { 'token': 'like' } },
		'lookup': 'appear-B',
		'combine': 1,
	},
	{
		'name': 'like -> just-like (the adposition)',
		'trigger': { 'token': 'like' },
		'lookup': 'like|just-like',
		'comment': 'this is needed so the adposition is found as well, which is handled by words like be/seem/sound/etc',
	},
	{
		'name': 'worry about',
		'trigger': { 'stem': 'worry' },
		'context': { 'followedby': { 'token': 'about' } },
		'lookup': 'worry',		// TODO make this a case frame rule
		'context_transform': { 'type': TOKEN_TYPE.FUNCTION_WORD },
	},
	{
		'name': 'what becomes thing-A in a question',
		'trigger': { 'token': 'What|what' },
		'context': { 'followedby': { 'token': '?', 'skip': 'all' } },
		'lookup': 'thing-A',
	},
	{
		'name': 'who becomes person-A in a question',
		'trigger': { 'token': 'Who|who' },
		'context': { 'followedby': { 'token': '?', 'skip': 'all' } },
		'lookup': 'person-A',
	},
]

/**
 *
 * @param {any} rule_json
 * @returns {TokenRule}
 */
export function parse_lookup_rule(rule_json) {
	const trigger = create_token_filter(rule_json['trigger'])
	const context = create_context_filter(rule_json['context'])

	const lookup_term = rule_json['lookup']
	const combine = rule_json['combine'] ?? 0

	const context_transforms = create_token_transforms(rule_json['context_transform'])

	return {
		trigger,
		context,
		action: lookup_rule_action,
	}

	/**
	 * 
	 * @param {Token[]} tokens 
	 * @param {number} trigger_index 
	 * @param {ContextFilterResult} context_result 
	 * @returns {number}
	 */
	function lookup_rule_action(tokens, trigger_index, { context_indexes }) {
		tokens[trigger_index] = { ...tokens[trigger_index], type: TOKEN_TYPE.LOOKUP_WORD, lookup_terms: lookup_term.split('|') }

		if (context_indexes.length === 0) {
			return trigger_index + 1
		}

		// apply possible context transforms
		apply_token_transforms(tokens, context_indexes, context_transforms)

		if (combine === 0 || context_indexes[combine-1] !== trigger_index + combine) {
			return trigger_index + 1
		}
		
		// combine context tokens into one
		const tokens_to_combine = tokens.splice(trigger_index, combine + 1)
		const new_token_value = tokens_to_combine.map(token => token.token).join(' ')
		tokens.splice(trigger_index, 0, { ...tokens_to_combine[0], token: new_token_value })
		return trigger_index + combine + 1
	}
}

export const LOOKUP_RULES = lookup_rules_json.map(parse_lookup_rule)