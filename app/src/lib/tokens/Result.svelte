<script>
	import TokenDisplay from './TokenDisplay.svelte'

	/** @type {Token} */
	export let token
	export let classes = ''

	// TODO: more work needed to handle multiple matches with possibly different levels, e.g., son
	const concept = token.lookup_results[0]
	const tooltip = token.lookup_results.map(result => `${result.stem}-${result.sense}`).join('; ')
</script>

<div class='tooltip' data-tip={tooltip}>
	<TokenDisplay classes="{classes} L{concept.level}">
		{token.token}
	</TokenDisplay>
</div>
