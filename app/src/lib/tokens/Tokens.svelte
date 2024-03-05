<script>
	import LookupWord from './LookupWord.svelte'
	import Ghost from './Ghost.svelte'
	import SingleToken from './SingleToken.svelte'
	import {TOKEN_TYPE} from '$lib/parser/token'

	/** @type {Token[]} */
	export let tokens

	/** @type {Map<TokenType, typeof LookupWord>}*/
	const component_map = new Map([
		[TOKEN_TYPE.FUNCTION_WORD, SingleToken],
		[TOKEN_TYPE.NOTE, SingleToken],
		[TOKEN_TYPE.PUNCTUATION, SingleToken],
		[TOKEN_TYPE.LOOKUP_WORD, LookupWord],
		[TOKEN_TYPE.GHOST, Ghost],
	])
</script>

{#each tokens as token}
	{@const component = component_map.get(token.type)}
	<svelte:component this={component} {token} />
{/each}
