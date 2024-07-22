// TODO store these in the database and allow user editing
/** @type {Map<string, any>} */
export const FUNCTION_WORDS = new Map([
	['a', { 'determiner': 'indefinite_article' }],
	['an', { 'determiner': 'indefinite_article' }],
	['certainly', { 'verb_polarity': 'emphatic_affirmative' }],
	['could', { 'modal': 'conditional_could' }],
	['definitely', { 'modal': 'definite_mood' }],
	['extremely', { 'degree': 'extremely_intensified' }],
	['from', {}],
	['here', { 'expansion': 'at_this_place' }],
	['it', { 'syntax': 'agent_proposition_subject' }],
	['least', { 'degree': 'least' }],
	['may', { 'modal': 'may_permissive_mood' }],
	['might', { 'modal': 'might_mood' }],
	['must', { 'modal': 'must_mood' }],
	['not', { 'verb_polarity': 'negative' }],
	['of', { 'relation': 'genitive_norman' }],
	['probably', { 'modal': 'probable_mood' }],
	['should',  { 'modal': 'should_mood' }],
	['than', { 'syntax': 'comparative_than' }],
	['that', { 'determiner': 'remote_demonstrative', 'syntax': 'relativizer' }],
	['the', { 'determiner': 'definite_article' }],
	['there', { 'expansion': 'at_that_place' }],
	['these', { 'determiner': 'near_demonstrative' }],
	['this', { 'determiner': 'near_demonstrative' }],
	['those', { 'determiner': 'remote_demonstrative' }],
	['to', {}],
	['too', { 'degree': 'too' }],
	['very', { 'degree': 'intensified' }],
	['will', { 'modal': 'future', 'time': 'future' }],
	['would', { 'modal': 'conditional_would' }],
	['who', { 'syntax': 'relativizer' }],
	['whom', { 'syntax': 'relativizer' }],
	['which', { 'syntax': 'relativizer', 'determiner': 'interrogative' }],
])

