import { CHECKER_RULES } from './checker_rules'
import { SYNTAX_RULES } from './syntax_rules'
import { LOOKUP_RULES } from './lookup_rules'
import { PART_OF_SPEECH_RULES } from './part_of_speech_rules'
import { rules_applier } from './rules_processor'
import { TRANSFORM_RULES } from './transform_rules'
import { PRONOUN_RULES } from './pronoun_rules'
import { CASE_FRAME_RULES } from './case_frame'
import { SENSE_RULES } from './sense_selection_rules'

const RULES = {
	PRONOUN: PRONOUN_RULES,
	LOOKUP: LOOKUP_RULES,
	SYNTAX: SYNTAX_RULES,
	PART_OF_SPEECH: PART_OF_SPEECH_RULES,
	TRANSFORM: TRANSFORM_RULES,
	CASE_FRAME: CASE_FRAME_RULES,
	SENSE: SENSE_RULES,	// TODO maybe these can be lumped in with the case-frame rules?
	CHECKER: CHECKER_RULES,
}

export {
	rules_applier,
	RULES,
}