import { renderToString } from 'react-dom/server';
import { type RenderFunc } from './RenderFunc';
import { App } from '../App';

export const serverRenderApp: RenderFunc = async (ctx) => {
	if (process.env.NODE_ENV === 'development') console.log('Rendering route: ', ctx.url, ctx.req.language);
	try {
		return await renderApp(ctx);
	} finally {
		if (process.env.NODE_ENV === 'development') console.log('Rendered route: ', ctx.url, ctx.req.language);
	}
};

export const renderApp: RenderFunc = async () => {
	const markup = renderToString(<App />);

	return {
		htmlReplace: {
			'<!--ssr-outlet-->': markup,
		},
		redirect: false,
	};
};
