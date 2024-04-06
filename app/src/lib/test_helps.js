import { expect } from 'vitest'

/**
 * @param {Token?} token 
 * @param {string} message 
 */
export function expect_error(token, message) {
	expect(token?.messages).toContainEqual({ message_type: 'error', message })
}
/**
 * @param {Token?} token 
 * @param {MessageType} message_type 
 * @param {string} message 
 */
export function expect_message(token, message_type, message) {
	expect(token?.messages).toContainEqual({ message_type, message })
}

/**
 * @param {Token?} token 
 * @param {RegExp} regex 
 */
export function expect_error_to_match(token, regex) {
	expect(token?.messages[0].message_type).toBe('error')
	expect(token?.messages[0].message).toMatch(regex)
}

/**
 * @param {Token?} token 
 * @param {MessageType} message_type 
 * @param {RegExp} regex 
 */
export function expect_message_to_match(token, message_type, regex) {
	expect(token?.messages[0].message_type).toBe(message_type)
	expect(token?.messages[0].message).toMatch(regex)
}

/**
 * 
 * @param {Token?} token 
 */
export function expect_no_message(token) {
	expect(token?.messages.length).toBe(0)
}

// TODO move other create_X() functions in here (rename as X_for_test())