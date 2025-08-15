type LexicalFormResult = LookupWord & {
	form: string
}

type OntologyResult = LookupWord & {
	sense: string
	level: string
	gloss: string
	categorization: string
	ontology_status: OntologyStatus
	how_to_hints: HowToEntry[]
}
