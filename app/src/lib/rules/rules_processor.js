import {TOKEN_TYPE, create_clause_token, create_error_token} from '$lib/parser/token'
import {CHECKER_RULES} from './checker_rules'
import {TRANSFORM_RULES} from './transform_rules'

/**
 * @template {TokenRule} R
 * @param {R[]} rules 
 * @param {Token[]} tokens 
 * @param {number} index 
 * @returns {R[]}
 */
function get_triggered_rules(rules, tokens, index) {
	return rules.filter(rule => rule.trigger(tokens[index]) && rule.context(tokens, index))
}

/**
 * 
 * @param {Sentence[]} sentences 
 * @returns {Sentence[]}
 */
export function apply_transform_rules(sentences, transforms=TRANSFORM_RULES) {
	return sentences.map(sentence => apply_transform_rules_by_sentence(sentence, transforms))
}

/**
 * 
 * @param {Sentence} sentence 
 * @param {TransformRule[]} transforms
 * @returns {Sentence}
 */
function apply_transform_rules_by_sentence(sentence, transforms) {
	const tokens = sentence.clause.sub_tokens
	const new_tokens = []

	for (let i = 0; i < tokens.length; i++) {
		const triggered_rules = get_triggered_rules(transforms, tokens, i)
		
		new_tokens.push(apply_transforms(triggered_rules, tokens[i]))
	}

	return { clause: create_clause_token(new_tokens) }

	/**
	 * 
	 * @param {TransformRule[]} rules 
	 * @param {Token} token 
	 */
	function apply_transforms(rules, token) {
		if (rules.length === 0) {
			return token
		} else if (rules.length === 1) {
			return rules[0].transform(token)
		} else {
			return rules.reduce((new_token, rule) => rule.transform(new_token), token)
		}
	}
}

/**
 * 
 * @param {Sentence[]} sentences 
 * @returns {Sentence[]}
 */
export function apply_checker_rules(sentences, rules=CHECKER_RULES) {
	return sentences.map(sentence => apply_checker_rules_by_sentence(sentence, rules))
}

/**
 * 
 * @param {Sentence} sentence 
 * @param {CheckerRule[]} rules
 * @return {Sentence}
 */
function apply_checker_rules_by_sentence(sentence, rules) {
	const tokens = sentence.clause.sub_tokens
	const new_tokens = []

	for (let i = 0; i < tokens.length; i++) {
		const triggered_rules = get_triggered_rules(rules, tokens, i)
		
		if (triggered_rules.length === 0) {
			new_tokens.push(tokens[i])
			continue
		}

		new_tokens.push(...create_context_tokens(triggered_rules, action => action.preceded_by))

		new_tokens.push(create_trigger_token(triggered_rules, tokens[i]))

		new_tokens.push(...create_context_tokens(triggered_rules, action => action.followed_by))
	}

	return { clause: create_clause_token(new_tokens) }

	/**
	 * 
	 * @param {CheckerRule[]} rules
	 * @param {(action: CheckerAction) => string?} token_getter
	 */
	function create_context_tokens(rules, token_getter) {
		return rules
			.filter(rule => token_getter(rule.require))
			// @ts-ignore
			.map(rule => create_error_token(token_getter(rule.require), rule.require.message))
	}

	/**
	 * 
	 * @param {CheckerRule[]} rules 
	 * @param {Token} token 
	 * @returns {Token}
	 */
	function create_trigger_token(rules, token) {
		const trigger_rules = rules.filter(rule => rule.require.preceded_by === undefined && rule.require.followed_by === undefined)
		if (trigger_rules.length > 0) {
			// only use the first message for now
			return {
				...token,
				type: TOKEN_TYPE.ERROR,
				message: trigger_rules[0].require.message,
			}
		}
		return token
	}
}