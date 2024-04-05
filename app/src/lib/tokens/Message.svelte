<script>
	import PopupMenu from './PopupMenu.svelte'
	import Table from './Table.svelte'
	import { Badge } from '$lib'
	import Icon from '@iconify/svelte'
    import { token_has_message } from '$lib/parser/token'

	/** @type {SimpleToken} */
	export let token

	const any_errors = token.messages.some(message => message.error)
	const any_suggests = token.messages.some(message => message.suggest)

	const text_class = any_errors ? 'text-error' : any_suggests ? 'text-warning' : ''
</script>

{#if token_has_message(token)}
<PopupMenu color_classes="bg-base-200 text-base-content">
	<Badge classes="badge-outline px-2 py-5 gap-2 join-item {text_class}" slot="button_content">
		{#if any_errors}
			<Icon icon="mdi:close-circle" class="h-6 w-6" />
		{:else if any_suggests}
			<Icon icon="mdi:lightbulb" class="h-6 w-6" />
		{/if}
		<slot />
	</Badge>

	<Table slot="popup_content" entries={token.messages} classes="my-2">
		<tr slot="entry_row" let:entry>
			{#if entry.error}
				<td><Icon icon="mdi:close-circle" class="h-6 w-6 text-error" /></td>
				<td>{entry.error}</td>
			{:else if entry.suggest}
				<td><Icon icon="mdi:lightbulb" class="h-6 w-6 text-warning" /></td>
				<td>{entry.suggest}</td>
			{/if}
		</tr>
	</Table>
</PopupMenu>
{/if}


