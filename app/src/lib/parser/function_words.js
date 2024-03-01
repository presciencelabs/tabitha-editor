// TODO store these in the database and allow user editing
export const FUNCTION_WORDS = new Map([
	['a', 'indefinite_article'],
	['an', 'indefinite_article'],
	['certainly', 'emphatic_affirmative_polarity'],
	['could', 'conditional_could'],
	['definitely', 'definite_mood'],
	['extremely', 'extremely_intensified_degree'],
	['from', 'source_role'],
	['it', 'agent_proposition'],
	['least', 'least_degree'],
	['might', 'might_mood'],
	['must', 'must_mood'],
	['not', 'negative_verb_polarity'],
	['of', 'genitive'],
	['probably', 'probable_mood'],
	['should', 'should_mood'],
	['stop', 'cessative_aspect'],
	['stopped', 'cessative_aspect|past_time'],
	['stops', 'cessative_aspect|present_time'],
	['than', 'comparative_degree'],
	['that', 'remote_demonstrative|relativizer|complementizer'],
	['the', 'definite_article'],
	['these', 'near_demonstrative'],
	['this', 'near_demonstrative'],
	['those', 'remote_demonstrative'],
	['to', 'destination_role|infinitive'],
	['too', 'too_degree'],
	['very', 'intensified_degree'],
	['will', 'future_time'],
	['would', 'conditional_would'],
	['who', 'interrogative_person|relativizer'],
	['whom', 'relativizer'],
	['what', 'interrogative_thing|relativizer'],
	['which', 'interrogative_which|relativizer'],
])

