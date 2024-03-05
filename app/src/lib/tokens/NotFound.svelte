<script>
	import TokenDisplay from './TokenDisplay.svelte'

	/** @type {Token} */
	export let token

	export let should_join = false
</script>

<TokenDisplay classes={should_join ? 'join-item' : ''}>
	{token.token}
</TokenDisplay>
