import { pipe } from '$lib/pipeline'
import { phrasify } from '$lib/parser/phrasify'
import { entityfy } from './entityfy'
import { replace_punctuation } from './other_rules'

/**
 * 
 * @param {Sentence[]} sentences 
 * @return {SimpleSourceEntity[]}
 */
export function analyze(sentences) {
	return pipe(
		replace_punctuation,
		phrasify,
		// replace GAP tokens
		// other movement rules,
		entityfy,
		// ordering_rules,
	)(sentences)
}