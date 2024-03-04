<script>
	import Error from './Error.svelte'
	import FunctionWord from './FunctionWord.svelte'
	import Note from './Note.svelte'
	import Punctuation from './Punctuation.svelte'
	import LookupWord from './LookupWord.svelte'
	import {TOKEN_TYPE} from '$lib/parser/token'
    import Suggest from './Suggest.svelte';

	/** @type {Token[]} */
	export let tokens

	/** @type {Map<TokenType, typeof Error>}*/
	const component_map = new Map([
		[TOKEN_TYPE.ERROR, Error],
		[TOKEN_TYPE.FUNCTION_WORD, FunctionWord],
		[TOKEN_TYPE.NOTE, Note],
		[TOKEN_TYPE.PUNCTUATION, Punctuation],
		[TOKEN_TYPE.LOOKUP_WORD, LookupWord],
	])
</script>

{#each tokens as token}
	{@const component = component_map.get(token.type)}
	{#if token.suggest}
		<Suggest {token}>
			<svelte:component this={component} {token} />
		</Suggest>
	{:else}
		<svelte:component this={component} {token} />
	{/if}
{/each}
