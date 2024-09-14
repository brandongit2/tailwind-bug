import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [
		react({
			babel: {
				targets: { chrome: '89', edge: '89', safari: '15', firefox: '89' },
				presets: [
					[
						'@babel/preset-react',
						{
							runtime: 'automatic',
						},
					],
				],
			},
		}),
		tailwindcss(),
	],
	server: {
		port: 3000,
		strictPort: true,
	},
});
