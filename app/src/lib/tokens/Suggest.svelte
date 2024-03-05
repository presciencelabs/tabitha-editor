<script>
    import Icon from '@iconify/svelte'
    import {Badge} from '$lib'

	/** @type {Token} */
	export let token
</script>

<div class="join">
	<div class="tooltip tooltip-warning join-item" data-tip={token.suggest_message} >
		<Badge classes="badge-outline badge-warning px-2 py-5 gap-2">
			<Icon icon="mdi:lightbulb" class="h-6 w-6" />
		</Badge>
	</div>
	<div class="join-item">
		<slot />
	</div>
</div>
