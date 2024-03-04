<script>
    import TokenDisplay from "./TokenDisplay.svelte";

	/** @type {Token} */
	export let token
</script>

<div class='tooltip' data-tip={token.tag}>
	{#if token.suggest}
		<TokenDisplay>
			{token.token}
		</TokenDisplay>
	{:else}
		<span>
			{token.token}
		</span>
	{/if}
</div>
