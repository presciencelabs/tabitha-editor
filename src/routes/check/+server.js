import { backtranslate } from '$lib/backtranslator'
import { parse } from '$lib/parser'
import { RULES } from '$lib/rules'
import { apply_rules } from '$lib/rules/rules_processor'
import { json } from '@sveltejs/kit'

/** @type {import('./$types').RequestHandler} */
export async function GET({ url: { searchParams } }) {
	/** @type {string} */
	const text = searchParams.get('text') ?? ''

	const debug = (searchParams.get('debug') ?? '').toLowerCase() === 'true'

	const sentences = await parse(text)
	const checked_sentences = apply_rules(sentences, RULES.CHECKER)
	const tokens = simplify_tokens(checked_sentences, debug)

	const back_translation = backtranslate(sentences)

	return response({ status: get_status(tokens), tokens, back_translation })

	/** @param {CheckResponse} result  */
	function response(result) {
		return json(result)
	}
}

/**
 * 
 * @param {SimpleToken[]} tokens 
 * @returns {CheckStatus}
 */
function get_status(tokens) {
	const all_messages = tokens.flatMap(expand_token).flatMap(token => token.messages)
	const has_error = all_messages.some(msg => msg.label === 'error')
	const has_warning = all_messages.some(msg => msg.label === 'warning')

	if (has_error) {
		return 'error'
	} else if (has_warning) {
		return 'warning'
	}

	return 'ok'
}

/**
 * 
 * @param {SimpleToken} token 
 * @returns {SimpleToken[]}
 */
function expand_token(token) {
	if (token.pairing) {
		return [token, token.pairing]
	} else if (token.pronoun) {
		return [token, token.pronoun]
	} else if (token.sub_tokens.length) {
		return [token, ...token.sub_tokens.flatMap(expand_token)]
	} else {
		return [token]
	}
}

/**
 * 
 * @param {Sentence[]} sentences 
 * @param {boolean} debug
 * @returns {SimpleToken[]}
 */
function simplify_tokens(sentences, debug) {
	return sentences.map(({ clause }) => simplify_token(clause))

	/**
	 * 
	 * @param {Token} token 
	 * @returns {SimpleToken}
	 */
	function simplify_token({ token, type, tag, messages, lookup_results, pairing, pairing_type, pronoun, sub_tokens, applied_rules }) {
		return {
			token,
			type,
			tag,
			messages: messages.toSorted((a, b) => a.severity - b.severity),
			lookup_results: lookup_results.map(simplify_lookup),
			pairing: pairing ? simplify_token(pairing) : null,
			pairing_type,
			pronoun: pronoun ? simplify_token(pronoun) : null,
			sub_tokens: sub_tokens.map(simplify_token),
			applied_rules: debug ? applied_rules : [],
		}
	}

	/**
	 * 
	 * @param {LookupResult} lookup 
	 * @returns {SimpleLookupResult}
	 */
	function simplify_lookup({ stem, part_of_speech, sense, form, level, gloss, categorization, ontology_status, how_to_entries, case_frame }) {
		return {
			stem,
			part_of_speech,
			sense,
			form,
			level,
			gloss,
			categorization,
			ontology_status,
			how_to_entries,
			case_frame: simplify_case_frame(case_frame),
		}
	}

	/**
	 * 
	 * @param {CaseFrame} case_frame 
	 * @returns {SimpleCaseFrame}
	 */
	function simplify_case_frame({ usage: { possible_roles, required_roles }, result: { status, valid_arguments, extra_arguments, missing_arguments } }) {
		return {
			status,
			valid_arguments: valid_arguments.reduce(simplify_argument_result, {}),
			extra_arguments: extra_arguments.reduce(simplify_argument_result, {}),
			missing_arguments,
			possible_roles,
			required_roles,
		}

		/**
		 * 
		 * @param {SimpleRoleArgResult} result 
		 * @param {RoleMatchResult} match 
		 */
		function simplify_argument_result(result, match) {
			const { trigger_token } = match.trigger_context
			return {
				...result,
				[match.role_tag]: trigger_token.lookup_results.at(0)?.stem ?? trigger_token.token,
			}
		}
	}
}