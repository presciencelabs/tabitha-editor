<script>
	import {token_has_concept, token_has_error} from '$lib/parser/token'
	import Error from './Error.svelte'
	import NotFound from './NotFound.svelte'
	import Result from './Result.svelte'

	/** @type {Token} */
	export let token
	export let classes = ''
</script>

{#if token_has_error(token)}
	<Error {token} {classes} />
{:else if token_has_concept(token)}
	<Result {token} {classes} />
{:else}
	<NotFound {token} {classes} />
{/if}