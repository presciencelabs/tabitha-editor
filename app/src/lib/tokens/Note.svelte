<script>
    import TokenDisplay from "./TokenDisplay.svelte";

	/** @type {Token} */
	export let token
</script>

{#if token.suggest}
	<TokenDisplay classes="font-mono">
		{token.token}
	</TokenDisplay>
{:else}
	<span class="font-mono text-lg tracking-widest">
		{token.token}
	</span>
{/if}
