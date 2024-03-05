<script>
	import Error from './Error.svelte'
	import TokenDisplay from './TokenDisplay.svelte'

	/** @type {Token} */
	export let token
</script>

{#if token.error_message}
	<Error {token} />
{:else if token.suggest_message}
	<TokenDisplay>
		{token.token}
	</TokenDisplay>
{:else}
	<span class="pb-3 text-6xl font-thin">
		{token.token}
	</span>
{/if}
