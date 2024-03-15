<script>
	import { PUBLIC_ONTOLOGY_API_HOST } from '$env/static/public'
	import { concept_with_sense } from '$lib/parser/token'
	import TokenDisplay from './TokenDisplay.svelte'
	import PopupTable from './PopupTable.svelte'

	/** @type {Token} */
	export let token
	export let classes = ''
</script>

<PopupTable entries={token.lookup_results}>
	<TokenDisplay classes={`L${token.lookup_results[0].concept?.level} ${classes}`} slot="button_content">
		{token.token}
	</TokenDisplay>

	<svelte:fragment slot="entry_row" let:entry>
		{@const show_hints = entry.concept === null || [2, 3].includes(entry.concept.level)}

		{#if entry.concept}
			{@const concept = entry.concept}
			{@const term = concept_with_sense(concept)}
			<tr>
				<td class="whitespace-nowrap">
					<a class="link not-prose {classes}" href={`${PUBLIC_ONTOLOGY_API_HOST}/?q=${term}`} target="_blank">
						{term}
					</a>
				</td>
				<td class="whitespace-nowrap">{concept.part_of_speech}</td>
				<td class="whitespace-nowrap">
					<span class="badge badge-md L{concept.level} font-mono">L{concept.level}</span>
				</td>
				<td>{concept.gloss}</td>
			</tr>
		{:else}
			<tr>
				<td class="whitespace-nowrap">{entry.stem}</td>
				<td class="whitespace-nowrap">{entry.part_of_speech}</td>
				<td>N/A</td>
				<td>Not in Ontology.</td>
			</tr>
		{/if}
		
		{#if show_hints}
			{@const has_structure = entry.how_to.some(hint => hint.structure)}
			{@const has_pairing = entry.how_to.some(hint => hint.pairing)}
			{@const has_explication = entry.how_to.some(hint => hint.explication)}
			{@const has_any_hint = has_structure || has_pairing || has_explication}

			<tr class="border-none">
				<td></td>
				<td colspan="3" class="pb-2" class:ps-0={has_any_hint}>
					{#if has_any_hint}
						<table class="table table-xs my-0 border-none">
							<thead class="border-none">
								<tr class="border-none">
									{#if has_structure}<th class="text-info-content">Structure</th>{/if}
									{#if has_pairing}<th class="text-info-content">Pairing</th>{/if}
									{#if has_explication}<th class="text-info-content">Explication</th>{/if}
								</tr>
							</thead>
							<tbody>
								{#each entry.how_to as hint}
									<tr class="border-none">
										{#if has_structure}<td class="whitespace-nowrap">{hint.structure}</td>{/if}
										{#if has_pairing}<td>{hint.pairing}</td>{/if}
										{#if has_explication}<td>{hint.explication}</td>{/if}
										{#if !(hint.structure || hint.pairing || hint.explication)}
											<td>No hints available at this time.</td>
										{/if}
									</tr>
								{/each}
							</tbody>
						</table>
					{:else}
						No hints available at this time.
					{/if}
				</td>
			</tr>
		{/if}
		
		<style lang="postcss">
			/** TODO I don't think we want this to apply to the inner table, but it currently does */
			/* .table-xs :where(th,td) {
				@apply py-2;
			} */
		</style>
	</svelte:fragment>
</PopupTable>

