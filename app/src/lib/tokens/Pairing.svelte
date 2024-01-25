<script>
	import Error from './Error.svelte'
	import Loading from './Loading.svelte'
	import Result from './Result.svelte'
	import NotFound from './NotFound.svelte'
	import {check_ontology} from '$lib/lookups'

	/** @type {CheckedToken} */
	export let checked_token

	$: [simple, complex] = split_pair(checked_token.token)

	// scenarios:
	//		good: follower follower/disciple
	//		bad: disciple /disciple follower/ disciple/disciple disciple/follower /
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

	/**
	 * @param {OntologyResult} token
	 */
	function is_simple(token) {
		return ['0','1'].includes(token.level)
	}

	/**
	 * @param {OntologyResult} token
	 */
	function is_complex(token) {
		return ['2','3'].includes(token.level)
	}
</script>

{#await lookup(simple, complex)}
	<Loading {checked_token} />
{:then [simple_result, complex_result]}
	<!-- TODO: consider multiple matches where the levels are different, e.g., son -->
	{@const simple_match = simple_result.matches?.[0]}
	{@const complex_match = complex_result.matches?.[0]}

	<div class="join">
		{#if simple_match}
			{#if is_simple(simple_match) }
				<Result result={simple_result} classes='join-item' />
			{:else}
				{@const error = {token: simple.token, message: 'Word must be a level 0 or 1'}}

				<Error checked_token={error} classes='join-item' />
			{/if}
		{:else}
			<NotFound {checked_token} classes='join-item' />
		{/if}

		<span class="badge badge-lg badge-outline px-1.5 py-5 text-2xl join-item">
			/
		</span>

		{#if complex_match}
			{#if is_complex(complex_match) }
				<Result result={complex_result} classes='join-item' />
			{:else}
				{@const error = {token: complex.token, message: 'Word must be a level 2 or 3'}}

				<Error checked_token={error} classes='join-item' />
			{/if}
		{:else}
			<NotFound {checked_token} classes='join-item' />
		{/if}
	</div>
{:catch}
	<NotFound {checked_token} />
{/await}
