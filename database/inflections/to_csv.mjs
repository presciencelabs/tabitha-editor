import { stdin as input, argv } from 'node:process'
import { createInterface } from 'node:readline'

const parts_of_speech = [
	'Adjective',
	'Adverb',
	'Noun',
	'Verb',
]

const part_of_speech = argv[2]
if (!parts_of_speech.includes(part_of_speech)) {
	console.error('part of speech is required and must be one of these: ', parts_of_speech)
	console.error('usage: node to_csv.mjs <part of speech> < <input file>')

	process.exit(1)
}

const extracted_data = new Map()

const line_reader = createInterface({ input })
line_reader.on('line', extract)
line_reader.on('close', output)

// extraction based on the following format as of Jan 2024:
//		Stems
//			ALL
//				1.  stem
//
//		Inflections
//			Verbs
//				1.  abandon
//					Past: abandoned   (suppletive)
//					Perfect: abandoned
//					Participle: abandoning   (suppletive)
//					Third Singular Present: abandons
//			Nouns
//				12.  Abel-Meholah
//					Plural: Abel-Meholahs
//				13.  Abel Beth Maakah
//					Plural: Abels Beth Maakah
//			Adverbs
//				1.  abundantly
//					Comparative:
//					Superlative:
//				13.  badly
//					Comparative: badlier
//					Superlative: badliest
//				16.  carefully
//					Comparative: carefully  more
//					Superlative: carefully  most
//				43.  greatly
//					Comparative: greater   (suppletive)
//					Superlative: greatest   (suppletive)
function extract(line) {
	if (!line) return

	const CHECK_FOR_STEM = /^\d+\.\s+(.+)$/
	const CHECK_FOR_INFLECTION = /^\s+.*:\s+(.+)$/

	const stem = line.match(CHECK_FOR_STEM)?.[1]
	const inflection = line.match(CHECK_FOR_INFLECTION)?.[1]

	if (stem) {
		extracted_data.set(stem, [])
	} else if (inflection) {
		const last_stem = [...extracted_data.keys()].at(-1)
		const ADDITIONAL_INFO = / {3}\(\w+\)/ // e.g.,   (suppletive)
		const normalized_inflection = inflection.replace(ADDITIONAL_INFO, '')

		extracted_data.get(last_stem).push(normalized_inflection)
	}
}

function output() {
	Array.from(extracted_data)
		.filter(has_inflections)
		.filter(has_no_space)
		.map(add_missing_inflections)
		.concat(add_missing_words())
		.map(log_csv)

	function has_inflections([, inflections]) {
		return inflections.length > 0
	}

	function has_no_space([stem]) {
		return !stem.includes(' ')
	}

	function add_missing_inflections([stem, inflections]) {
		if (stem === 'be') {
			// these forms are not present in TBTA's lexical data because be is so irregular...
			// they are only produced during the rules phase so they need to be added manually here.
			inflections.push('am', 'are', 'were')
		}

		return [stem, inflections]
	}

	function add_missing_words() {
		// TODO add more or remove some when we include Analyzer inflections as well
		// see https://github.com/presciencelabs/tabitha-editor/issues/37
		const missing_words = {
			Adjective: [
				['left', ['','']],	// important for disambiguation with 'leave'
			],
			Verb: [
				['goodbye', ['goodbied','goodbied','goodbying','goodbyes']],
				['pity', ['pitied','pitied','pitying','pities']],
				['sex', ['sexed','sexed','sexing','sexes']],
			],
		}
		return missing_words[part_of_speech] || []
	}

	function log_csv([stem, inflections]) {
		console.log(`${stem},${part_of_speech},|${inflections.join('|')}|`)
	}
}