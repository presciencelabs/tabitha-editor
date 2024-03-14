<script>
	import { PUBLIC_ONTOLOGY_API_HOST } from '$env/static/public'
	import { concept_with_sense } from '$lib/parser/token'
	import TokenDisplay from './TokenDisplay.svelte'
	import Badge from '$lib/Badge.svelte'
	import PopupTable from './PopupTable.svelte'

	/** @type {Token} */
	export let token
	export let classes = ''
</script>

<PopupTable entries={token.lookup_results}>
	<TokenDisplay classes={`L${token.lookup_results[0].concept?.level} ${classes}`} slot="button_content">
		{token.token}
	</TokenDisplay>

	<tr slot="header_row">
		<th></th>
		<th></th>
		<th class="text-info-content">Level</th>
		<th class="text-info-content">Gloss</th>
	</tr>

	<tr slot="entry_row" let:entry>
		{#if entry.concept}
			{@const concept = entry.concept}
			{@const term = concept_with_sense(concept)}
			<td class="whitespace-nowrap">
				<a class="link not-prose {classes}" href={`${PUBLIC_ONTOLOGY_API_HOST}/?q=${term}`} target="_blank">
					{term}
				</a>
			</td>
			<td class="whitespace-nowrap">{concept.part_of_speech}</td>
			<td class="whitespace-nowrap">
				<Badge classes="L{concept.level} font-mono">L{concept.level}</Badge>
			</td>
			<td>{concept.gloss}</td>
			<!-- TODO integrate hints from how-to -->
		{:else}
			<th class="whitespace-nowrap">{entry.stem}</th>
			<td class="whitespace-nowrap">{entry.part_of_speech}</td>
			<td></td>
			<!-- TODO integrate hints from how-to -->
			<td>Check How-To document for usage</td>
		{/if}
	</tr>
</PopupTable>
