import { expect } from 'vitest'
import { get_message_type } from './token'

export function expect_error(token: Token | null | undefined, message: string) {
	expect_message(token, 'error', message)
}

export function expect_message(token: Token | null | undefined, label: MessageLabel, message: string) {
	expect(token?.messages).toContainEqual(expect.objectContaining({ ...get_message_type(label), message }))
}

export function expect_error_to_match(token: Token | null | undefined, regex: RegExp) {
	expect_message_to_match(token, 'error', regex)
}

export function expect_message_to_match(token: Token | null | undefined, message_type: MessageLabel, regex: RegExp) {
	expect(token?.messages[0].label).toBe(message_type)
	expect(token?.messages[0].message).toMatch(regex)
}

export function expect_no_message(token: Token | null | undefined) {
	expect(token?.messages.length).toBe(0)
}

// TODO move other create_X() functions in here (rename as X_for_test())