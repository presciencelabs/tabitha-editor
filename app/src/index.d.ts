type Token = string

type CheckedToken = {
	token: Token
	message: string
}

interface LookupResultsToken extends CheckedToken {
	levels: string[]
}

type LookupTerm = string

type LookupResult<T> = {
	matches: T[]
}

type OntologyResult = {
	id: string
	stem: string
	sense: string
	level: string
}
