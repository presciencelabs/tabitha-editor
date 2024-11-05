type RoleTag = string
type WordSense = string
type WordStem = string

type ArgumentRoleRule = {
	role_tag: RoleTag
	// if the trigger rule is relative to the trigger word, this index tells the rule which context index the argument is at
	relative_context_index: number
	trigger_rule: TokenRule
	missing_message: string
	extra_message: string
	main_word_tag: Tag
}

type ArgumentRulesForSense = {
	sense: WordSense
	rules: ArgumentRoleRule[]
	other_required: RoleTag[]
	other_optional: RoleTag[]
	patient_clause_type: RoleTag
}

type RoleUsageInfo = {
	possible_roles: RoleTag[]
	required_roles: RoleTag[]
}

type RoleMatchResult = {
	role_tag: RoleTag
	success: boolean
	trigger_context: RuleTriggerContext
	rule: ArgumentRoleRule
}

type CaseFrameResult = {
	is_valid: boolean
	is_checked: boolean
	valid_arguments: RoleMatchResult[]
	extra_arguments: RoleMatchResult[]
	missing_arguments: ArgumentRoleRule[]
}

type CaseFrameRuleJson = TransformRuleJson & {
	tag_role?: boolean
	main_word_tag?: Tag
	argument_context_index?: number
	missing_message?: string
	extra_message?: string
}

type RoleRuleValueJson = CaseFrameRuleJson | CaseFrameRuleJson[]

type VerbRoleTag = 'agent' | 'patient' | 'state' | 'source' | 'destination' | 'instrument' | 'beneficiary' | 'predicate_adjective'
	| 'agent_clause' | 'patient_clause_different_participant' | 'patient_clause_same_participant' | 'patient_clause_simultaneous' | 'patient_clause_quote_begin'
type AdjectiveRoleTag = 'modified_noun' | 'nominal_argument' | 'patient_clause_different_participant' | 'patient_clause_same_participant'
type AdpositionRoleTag = 'opening_subordinate_clause' | 'in_noun_phrase'
type OtherRoleTag = RoleTag

type SenseRuleJsonBase = {
	patient_clause_type?: string
	other_rules?: { [other_tag: OtherRoleTag]: RoleRuleValueJson }
	other_required?: RoleTag
	other_optional?: RoleTag
	comment?: string
}

type RoleRuleJson<K> = {
	[key in K]?: RoleRuleValueJson
}

type SenseRuleJson<K> = SenseRuleJsonBase & RoleRuleJson<K>