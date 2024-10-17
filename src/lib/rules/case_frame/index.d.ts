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
	possible_roles: string[]
	required_roles: string[]
}

type ArgumentMatchFilter = (role_matches: RoleMatchResult[]) => boolean

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

type SensePresetKey = string
type RolePresetKey = string

// this has to remain 'any' because it's used to set values. see https://stackoverflow.com/questions/57774361/typescript-interface-key-string#answer-57775405
type RolePresetValue = any

type RoleRulePreset = [RolePresetKey, (preset_value: RolePresetValue, role_tag: RoleTag) => CaseFrameRuleJson]

type CaseFrameRuleJson = TransformRuleJson & {
	tag_role?: boolean
	main_word_tag?: Tag
	argument_context_index?: number
	missing_message?: string
	extra_message?: string
	argument_context_index?: number
} & {
	[preset: RolePresetKey]: RolePresetValue
}

type RoleRuleJson = {
	[role_tag: RoleTag | RolePresetKey]: CaseFrameRuleJson | RolePresetValue
}

type SenseRuleJson = RoleRuleJson | SensePresetKey