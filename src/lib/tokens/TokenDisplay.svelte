<script lang="ts">
	import { Badge } from '$lib'
	import type { Snippet } from 'svelte'

	interface Props {
		children: Snippet
		classes?: string
	}

	let { children, classes = '' }: Props = $props()
</script>

<Badge classes="badge-outline px-4 py-5 text-lg tracking-widest {classes}" {children} />
