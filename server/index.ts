import express from 'express';
import path from 'path';
import fs from 'fs';
import type { ViteDevServer } from 'vite';
import { fileURLToPath } from 'url';
import { RenderFunc } from './RenderFunc.js';
import { randomUUID } from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createServer() {
	const server = express().disable('x-powered-by');

	// Create Vite server in middleware mode and configure the app type as
	// 'custom', disabling Vite's own HTML serving logic so parent server
	// can take control
	let vite: ViteDevServer | undefined;
	const { createServer: createViteServer } = await import('vite');
	vite = await createViteServer({
		server: { middlewareMode: true },
		appType: 'custom',
		configFile: path.resolve(__dirname, '../../', 'vite.config.ts'),
	});

	// Use vite's connect instance as middleware. If you use your own
	// express router (express.Router()), you should use router.use
	// When the server restarts (for example after the user modifies
	// vite.config.js), `vite.middlewares` is still going to be the same
	// reference (with a new internal stack of Vite and plugin-injected
	// middlewares. The following is valid even after restarts.
	server.use(vite.middlewares);

	const port = 3000;
	server.listen(port, () => {
		console.log(`> App started http://localhost:${port}`);
	});

	let serverMiddleware: express.Handler;
	serverMiddleware = async (req: express.Request, res: express.Response, next) => {
		const url = req.path;
		try {
			let render: RenderFunc;
			let template: string;
			const templateBase = fs.readFileSync(path.resolve(vite.config.root, 'index.html'), 'utf-8');
			// 2. Apply Vite HTML transforms. This injects the Vite HMR client,
			//    and also applies HTML transforms from Vite plugins, e.g. global
			//    preambles from @vitejs/plugin-react
			template = await vite.transformIndexHtml(url, templateBase);

			// 3. Load the server entry. ssrLoadModule automatically transforms
			//    ESM source code to be usable in Node.js! There is no bundling
			//    required, and provides efficient invalidation similar to HMR.
			const mod = await vite.ssrLoadModule('/server/ssr-entry.tsx');
			render = mod.serverRenderApp;

			// 4. render the app HTML. This assumes entry-server.js's exported
			//     `render` function calls appropriate framework SSR APIs,
			//    e.g. ReactDOMServer.renderToString()

			// 5. Inject the app-rendered HTML into the template.
			const { htmlReplace = {}, redirect = false } = await render({ url, req, res });

			if (redirect) {
				res.redirect(redirect);
			} else {
				res
					.contentType('text/html')
					.send(Object.entries(htmlReplace).reduce((acc, [key, value]) => acc.replace(key, value), template));
			}
		} catch (e) {
			// If an error is caught, let Vite fix the stack trace so it maps back
			// to your actual source code.
			vite?.ssrFixStacktrace(e as any);
			console.log(e);
			next(e);
		}
	};

	console.log('Server initialization complete');
	server.get('*', serverMiddleware);

	// Backup catch-all route handler in the rare case that our server middleware silently fails
	server.get('*', (req, res) => {
		const random = randomUUID(); // For ease in correlating the server response to the server logs
		console.error(
			`Frontend server middleware failed to handle request ${req.url}. Random key sent to client: ${random}`,
		);
		res.status(500).end(`Server couldn't handle request. (${random})`);
	});
}

createServer();
