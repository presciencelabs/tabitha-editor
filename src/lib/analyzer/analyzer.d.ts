type SimpleSourceEntity = {
	category: CategoryName
	value: string
	features: EntityFeature[]
	concept: SourceConcept|null
	pairing_concept: SourceConcept|null
	pairing_type: PairingType
}

type SourceConcept = {
	stem: string
	sense: string
	part_of_speech: string
}

type CategoryName = string
type FeatureName = string
type FeatureValue = string

type EntityFeature = {
	name: FeatureName,
	value: FeatureValue,
}