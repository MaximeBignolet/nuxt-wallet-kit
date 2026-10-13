// @ts-check
import { createConfigForNuxt } from '@nuxt/eslint-config/flat';

export default createConfigForNuxt({
	features: {
		tooling: true,
		stylistic: {
			indent: `tab`,
			semi: true,
		},
	},
	dirs: {
		src: [
			`./playground`,
		],
	},
})
	.append({
		rules: {
			'@stylistic/quotes': [`error`, `backtick`, { allowTemplateLiterals: `always` }],
		},
	});
