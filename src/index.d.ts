type TokenType = 'Punctuation' | 'Note' | 'FunctionWord' | 'Word' | 'Clause' | 'Added' | 'Phrase'

interface MessagedToken {
	token: string
	type: TokenType
	tag: Tag
	messages: Message[]
}

interface Token extends MessagedToken {
	specified_sense: string
	lookup_terms: LookupTerm[]
	lookup_results: LookupResult[]
	complex_pairing: Token | null
	pronoun: Token | null
	sub_tokens: Token[]
}

type Tag = { [tag: string]: string }

type Clause = Token
type Phrase = Token

type Sentence = {
	clause: Clause
}

// Messages
type MessageLabel = 'error' | 'warning' | 'suggest' | 'info'

interface MessageType {
	label: MessageLabel
	severity: number
}

interface Message extends MessageType {
	message: string
	// TODO #101 add optional fix_action structure
}

type MessageInfo = {
	token_to_flag?: Token
	plain?: boolean
} & {
	[key in MessageLabel]?: string
}

// Lookup values
type LookupTerm = string

interface LookupWord {
	stem: string
	part_of_speech: string
}

interface LookupResult extends LookupWord {
	lexicon_id: number
	form: string
	// TODO include features
	ontology_id: number
	sense: string
	level: number
	gloss: string
	categorization: string
	how_to_entries: HowToEntry[]
	case_frame: CaseFrameResult
}

type HowToEntry = {
	structure: string
	pairing: string
	explication: string
}

// External API Responses
interface LexicalFormResult extends LookupWord {
	id: number
	form: string
}

interface OntologyResult extends LookupWord {
	id: string
	sense: string
	level: number
	gloss: string
	categorization: string
}

interface HowToResult extends HowToEntry {
	term: string
	part_of_speech: string
}

// Internal API response
type CheckResponse = {
	has_error: boolean
	tokens: SimpleToken[]
	back_translation: string
}

interface SimpleToken extends MessagedToken {
	lookup_results: SimpleLookupResult[]
	complex_pairing: SimpleToken | null
	pronoun: SimpleToken | null
	sub_tokens: SimpleToken[]
}

interface SimpleLookupResult extends LookupWord {
	lexicon_id: number
	form: string
	// TODO include features
	ontology_id: number
	sense: string
	level: number
	gloss: string
	categorization: string
	how_to_entries: HowToEntry[]
	case_frame: SimpleCaseFrameResult
}

type SimpleCaseFrameResult = {
	is_valid: boolean
	is_checked: boolean
	valid_arguments: SimpleRoleArgResult
	extra_arguments: SimpleRoleArgResult
	missing_arguments: RoleTag[]
}

type SimpleRoleArgResult = {
	[role: RoleTag]: string
}
