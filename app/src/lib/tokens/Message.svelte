<script>
	import PopupMenu from './PopupMenu.svelte'
	import Table from './Table.svelte'
	import { Badge } from '$lib'
	import Icon from '@iconify/svelte'
	import { token_has_message } from '$lib/parser/token'

	/** @type {SimpleToken} */
	export let token

	const message_ui = {
		error: { text_class: 'text-error', icon: 'close-circle' },
		warning: { text_class: 'text-warning', icon: 'warning' },
		suggest: { text_class: 'text-warning', icon: 'lightbulb' },
		info: { text_class: 'text-info', icon: 'information' },
	}
</script>

{#if token_has_message(token)}
	{@const top_ui = message_ui[token.messages[0].message_type]}
	<PopupMenu color_classes="bg-base-200 text-base-content">
		<Badge classes="badge-outline px-2 py-5 gap-2 join-item {top_ui.text_class}" slot="button_content">
			<Icon icon="mdi:{top_ui.icon}" class="h-6 w-6" />
			<slot />
		</Badge>

		<Table slot="popup_content" entries={token.messages} classes="my-2">
			<tr slot="entry_row" let:entry>
				{@const { text_class, icon } = message_ui[entry.message_type]}
				<td><Icon icon="mdi:{icon}" class="h-6 w-6 {text_class}" /></td>
				<td>{entry.message}</td>
			</tr>
		</Table>
	</PopupMenu>
{/if}
