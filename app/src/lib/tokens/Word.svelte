<script>
	import {token_has_concept} from '$lib/parser/token'
	import NotFound from './NotFound.svelte'
	import Result from './Result.svelte'

	/** @type {Token} */
	export let token
	export let should_join = false
</script>

{#if token_has_concept(token)}
	<Result {token} {should_join} />
{:else}
	<NotFound {token} {should_join} />
{/if}