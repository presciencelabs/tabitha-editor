<script>
	import Loading from './Loading.svelte'
	import LookupResult from './LookupResult.svelte' //TODO: this will cause a name conflict with the existing type
	import NotFound from './NotFound.svelte'
	import {check_ontology} from '$lib/lookups'

	/** @type {CheckedToken} */
	export let checked_token

	$: [simple, complex] = split_pair(checked_token.token)

	// scenarios:
	//		good: follower follower/disciple
	//		bad: disciple /disciple follower/ disciple/disciple /
	/**
	 * @param {string} token
	 * @returns {CheckedToken[]}
	 */
	function split_pair(token) {
		return token.split('/').map(token => ({token, message: checked_token.message}))
	}

	/**
	 * @param {CheckedToken} simple
	 * @param {CheckedToken} complex
	 */
	async function lookup(simple, complex) {
		return Promise.all([
			check_ontology(simple),
			check_ontology(complex),
		])
	}
</script>

{#await lookup(simple, complex)}
	<Loading {checked_token} />
{:then [simple_result, complex_result]}
	<div class="join">
		<LookupResult result={simple_result} classes='join-item' />

		<span class="badge badge-lg badge-outline px-1.5 py-5 text-2xl join-item">
			/
		</span>

		<LookupResult result={complex_result} classes='join-item' />
	</div>
{:catch}
	<NotFound {checked_token} />
{/await}
