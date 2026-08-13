<script lang="ts">
	import TokenWrapper from './TokenWrapper.svelte'

	interface Props {
		token: SimpleToken
		classes?: string
	}

	let { token, classes = '' }: Props = $props()
</script>

<TokenWrapper {token} classes="font-mono text-lg tracking-widest {classes}" />
