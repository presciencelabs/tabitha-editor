import {pipe} from '$lib/pipeline'
import {tokenize_input} from './tokenize'
import {check_capitalization, check_for_pronouns} from './syntax'
import {perform_ontology_lookups} from '$lib/lookups'
import {check_pairings} from './pairings'
import {clausify, flatten_sentences} from './clausify'
import {rules_applier} from '../rules/rules_processor'
import {LOOKUP_RULES} from '../rules/lookup_rules'
import {TRANSFORM_RULES} from '../rules/transform_rules'
import {CHECKER_RULES} from '../rules/checker_rules'

/**
 * @param {string} text
 * @returns {Promise<Token[]>}
 */
export async function parse(text) {
	const pre_lookups = pipe(
		tokenize_input,
		check_for_pronouns,
		clausify,
		check_capitalization,
		rules_applier(LOOKUP_RULES),
	)(text)

	const with_lookups = await perform_ontology_lookups(pre_lookups)

	return pipe(
		rules_applier(TRANSFORM_RULES),
		rules_applier(CHECKER_RULES),
		flatten_sentences,
		check_pairings,
	)(with_lookups)
}

/**
 * TODO: temporary... need to build e2e testing infrastructure
 * 
 * @param {string} text
 * @returns {Token[]}
 */
export function parse_for_test(text) {
	return pipe(
		tokenize_input,
		check_for_pronouns,
		clausify,
		check_capitalization,
		rules_applier(LOOKUP_RULES),
		rules_applier(TRANSFORM_RULES),
		rules_applier(CHECKER_RULES),
		flatten_sentences,
		check_pairings,
	)(text)
}
