import { browser } from '$app/environment'
import SaveButton from './SaveButton.svelte'
import { writable, type Writable } from 'svelte/store'

const saved = init()

function init(): Writable<string> {
	const store = writable<string>('', set => {
		const value = browser && localStorage?.getItem('saved') || ''
		set(value)
	})

	const { subscribe, set, update } = store

	return {
		subscribe,
		set: (value: string) => {
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			browser && localStorage.setItem('saved', value)
			set(value)
		},
		update,
	}
}

export {
	saved,
	SaveButton,
}
