<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		popup_content: Snippet
		button_content: Snippet
		color_classes?: string
	}

	let { popup_content, button_content, color_classes = 'bg-info text-info-content' }: Props = $props()
</script>

<div class="dropdown dropdown-hover dropdown-top">
	<div class="overflow-x-auto dropdown-content z-[1] menu shadow-xl {color_classes} rounded-box w-96 max-h-80">
		{@render popup_content()}
	</div>
	<div role="button">
		{@render button_content()}
	</div>
</div>
