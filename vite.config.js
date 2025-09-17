import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { sveltekit } from '@sveltejs/kit/vite'

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
	],

	test: {
		include: [
			'src/**/*.test.js',
		],
	},

	server: {
		host: 'localhost.tabitha.bible',
		port: 5173,
	},
})
