<script>
	import TokenDisplay from './TokenDisplay.svelte'

	/** @type {Token} */
	export let token
	export let classes = ''

	const how_to_entries = token.lookup_results.flatMap(result => result.how_to)
	const has_structure = how_to_entries.some(result => result.structure)
	const has_pairing = how_to_entries.some(result => result.pairing)
	const has_explication = how_to_entries.some(result => result.explication)
</script>

{#if how_to_entries.length}
	<div class="dropdown dropdown-hover dropdown-top">
		<div class="overflow-x-auto dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-96">
			<table class="table table-xs my-0">
				<thead>
					<tr>
						<th></th>
						{#if has_structure}<th>Structure</th>{/if}
						{#if has_pairing}<th>Pairing</th>{/if}
						{#if has_explication}<th>Explication</th>{/if}
					</tr>
				</thead>
				<tbody>
					{#each how_to_entries as entry}
					<tr>
						<th>{`${entry.term} (${entry.part_of_speech})`}</th>
						{#if has_structure}<td>{entry.structure}</td>{/if}
						{#if has_pairing}<td>{entry.pairing}</td>{/if}
						{#if has_explication}<td>{entry.explication}</td>{/if}
					</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<div role="button">
			<TokenDisplay {classes}>
				{token.token}
			</TokenDisplay>
		</div>
	</div>
{:else}
<TokenDisplay {classes}>
	{token.token}
</TokenDisplay>
{/if}