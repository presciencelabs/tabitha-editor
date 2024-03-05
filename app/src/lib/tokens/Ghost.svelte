<script>
	import Error from './Error.svelte'
	import TokenDisplay from './TokenDisplay.svelte'

	/** @type {Token} */
	export let token

	export let classes = ''
</script>

{#if token.error_message}
	<Error {token} />
{:else}
	<TokenDisplay classes="{classes}">
		{token.token}
	</TokenDisplay>
{/if}
