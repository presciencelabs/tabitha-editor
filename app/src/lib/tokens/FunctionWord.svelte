<script>
	import TokenDisplay from './TokenDisplay.svelte'

	/** @type {Token} */
	export let token
	export let should_join = false
</script>

{#if should_join}
	<TokenDisplay classes="!px-2 join-item">{token.token}</TokenDisplay>
{:else}
	<span>
		{token.token}
	</span>
{/if}
