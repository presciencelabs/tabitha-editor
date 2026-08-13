<script lang="ts">
	import TokenDisplay from './TokenDisplay.svelte'
	import type { Snippet } from 'svelte'

	interface Props {
		token: SimpleToken
		classes?: string
		children?: Snippet
	}

	let { token, classes = '', children }: Props = $props()
</script>

{#if classes.includes('join-item')}
	<TokenDisplay {classes}>
		{token.token}
	</TokenDisplay>
{:else}
	<span class={classes.trim()}>
		{#if children}
			{@render children()}
		{:else}
			{token.token}
		{/if}
	</span>
{/if}
