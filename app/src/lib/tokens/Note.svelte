<script>
	import TokenDisplay from './TokenDisplay.svelte'
	import Error from './Error.svelte'

	/** @type {Token} */
	export let token
</script>


{#if token.error_message}
	<Error {token} />
{:else if token.suggest_message}
	<TokenDisplay classes="font-mono">
		{token.token}
	</TokenDisplay>
{:else}
	<span class="font-mono text-lg tracking-widest">
		{token.token}
	</span>
{/if}
