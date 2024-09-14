import type * as express from 'express';

export type PageContext = {
	url: string;
	req: express.Request;
	res: express.Response;
};

export type RenderFuncReturn = {
	htmlReplace: Record<string, string> | undefined;
	redirect: false | string;
};

export type RenderFunc = (pageContext: PageContext) => Promise<RenderFuncReturn>;
