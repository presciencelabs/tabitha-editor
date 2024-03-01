<script>
	import Pairing from './Pairing.svelte'
	import Word from './Word.svelte'

	/** @type {Token} */
	export let token
	export let classes = ''
</script>

{#if token.complex_pairing}
	<Pairing {token} />
{:else}
	<Word {token} {classes} />
{/if}