<script>
	import TokenDisplay from './TokenDisplay.svelte'

	/** @type {Token} */
	export let token
	export let should_join = false
</script>

{#if should_join}
	<TokenDisplay classes="join-item">{token.token}</TokenDisplay>
{:else}
	<span class="font-mono text-lg tracking-widest">
		{token.token}
	</span>
{/if}
