import { TOKEN_TYPE, is_one_part_of_speech } from '$lib/parser/token'
import { create_context_filter, create_token_filter, simple_rule_action } from '../rules_parser'
import { select_sense } from './sense_selection'
import { check_adjective_case_frames } from './adjectives'
import { check_verb_case_frames, check_verb_case_frames_passive } from './verbs'


/** @type {BuiltInRule[]} */
const argument_and_sense_rules = [
	{
		name: 'Adjective case frames',
		comment: '',
		rule: {
			trigger: create_token_filter({ 'category': 'Adjective' }),
			context: create_context_filter({}),
			action: simple_rule_action(check_adjective_case_frames),
		},
	},
	{
		name: 'Adjective sense selection',
		comment: 'Need to select the sense so that it transforms the adjective arguments before checking the Verb case frames',
		rule: {
			trigger: create_token_filter({ 'category': 'Adjective' }),
			context: create_context_filter({}),
			action: simple_rule_action(select_sense),
		},
	},
	{
		name: 'Verb case frame, active',
		comment: 'For now, only trigger when not within a relative clause, question, or same-subject clause since arguments get moved around or are missing',
		rule: {
			trigger: create_token_filter({ 'category': 'Verb' }),
			context: create_context_filter({
				'notprecededby': { 'tag': [{ 'syntax': 'relativizer|infinitive_same_subject' }, { 'auxiliary': 'passive' }], 'skip': 'all' },
				'notfollowedby': { 'token': '?', 'skip': 'all' },
			}),
			action: simple_rule_action(check_verb_case_frames),
		},
	},
	{
		name: 'Verb case frame, passive',
		comment: 'For now, only trigger when not within a relative clause or a question since arguments get moved around or are missing',
		rule: {
			trigger: create_token_filter({ 'category': 'Verb' }),
			context: create_context_filter({
				'precededby': { 'tag': { 'auxiliary': 'passive' }, 'skip': 'all' },
				'notprecededby': { 'tag': { 'syntax': 'relativizer|infinitive_same_subject' }, 'skip': 'all' },
				'notfollowedby': { 'token': '?', 'skip': 'all' },
			}),
			action: simple_rule_action(check_verb_case_frames_passive),
		},
	},
	{
		name: 'Other word sense selection',
		comment: 'Adjective senses have already been selected',
		rule: {
			trigger: token => token.type === TOKEN_TYPE.LOOKUP_WORD
					&& is_one_part_of_speech(token)
					&& !create_token_filter({ 'category': 'Adjective' })(token),
			context: create_context_filter({}),
			action: simple_rule_action(select_sense),
		},
	},
]

export const ARGUMENT_AND_SENSE_RULES = argument_and_sense_rules.map(({ rule }) => rule)