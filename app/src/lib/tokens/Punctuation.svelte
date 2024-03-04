<script>
    import TokenDisplay from "./TokenDisplay.svelte";

	/** @type {Token} */
	export let token
</script>

{#if token.suggest}
	<TokenDisplay>
		{token.token}
	</TokenDisplay>
{:else}
	<span class="pb-3 text-6xl font-thin">
		{token.token}
	</span>
{/if}
