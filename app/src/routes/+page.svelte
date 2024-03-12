<script>
	import {backtranslate} from '$lib/backtranslator'
	import {parse} from '$lib/parser'
	import {token_has_error} from '$lib/parser/token'
	import {Tokens} from '$lib/tokens'
	import Icon from '@iconify/svelte'

	const copy_tracker = {
		english_back_translation: false,
		entered_text: false,
	}

	let entered_text = ''
	$: english_back_translation = backtranslate(entered_text)

	/** @param {string} text */
	async function copy(text) {
		// https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText
		await navigator.clipboard.writeText(text)

		const TWO_SECONDS = 2000
		if (text === entered_text) {
			copy_tracker.entered_text = true

			setTimeout(() => copy_tracker.entered_text = false, TWO_SECONDS)
		}

		if (text === english_back_translation) {
			copy_tracker.english_back_translation = true

			setTimeout(() => copy_tracker.english_back_translation = false, TWO_SECONDS)
		}
	}

	/**
	 * @param {Token[]} tokens
	 */
	function check_for_error(tokens) {
		return tokens.some(token => token_has_error(token)
			|| token.complex_pairing && token_has_error(token.complex_pairing)
			|| token.pronoun && token_has_error(token.pronoun))
	}
</script>

<form class="grid justify-items-center">
	<!-- svelte-ignore a11y-autofocus -->
	<textarea bind:value={entered_text} rows="5" autofocus class="textarea textarea-bordered textarea-lg w-4/5" />

	<button on:click={async () => await copy(entered_text)} class="btn btn-secondary mt-8 gap-4 self-center">
		Copy to clipboard

		<Icon icon={ copy_tracker.entered_text ? 'mdi:check' : 'mdi:content-copy'} class="h-6 w-6" />
	</button>
</form>

{#await parse(entered_text)}
	<div class="divider my-12 divider-warning">
		<Icon icon="line-md:loading-twotone-loop" class="h-16 w-16 text-warning" />
	</div>
{:then tokens}
	{@const has_error = check_for_error(tokens)}
	{@const success = tokens.length > 0 && !has_error}

	<div class="divider my-12" class:divider-success={success} class:divider-error={has_error}>
		{#if success}
			<Icon icon="mdi:check-circle" class="h-16 w-16 text-success" />
		{:else if has_error}
			<Icon icon="mdi:close-circle" class="h-16 w-16 text-error" />
		{/if}
	</div>

	<section class="prose flex max-w-none flex-wrap items-center justify-center gap-x-4 gap-y-8">
		<Tokens {tokens} />
	</section>
{/await}

{#if english_back_translation}
	<div class="prose divider mb-12 mt-20 max-w-none">
		<h2>English back translation</h2>
	</div>

	<section class="prose mx-auto flex flex-col text-lg">
		<p>
			{english_back_translation}
		</p>

		<button on:click={async () => await copy(english_back_translation)} class="btn btn-secondary mt-8 gap-4 self-center">
			Copy to clipboard

			<Icon icon={ copy_tracker.english_back_translation ? 'mdi:check' : 'mdi:content-copy'} class="h-6 w-6" />
		</button>
	</section>
{/if}

<style lang="postcss">
	/* had to override daisyui's sizing so I could make the line bigger */
	.divider::before,
	.divider::after {
		@apply h-2;
	}
</style>
