import { rest } from 'msw';
import { baseUrl } from './constants';

export const handlers = [
  // Handles a POST /login request
  rest.get(`${baseUrl}/samples/*`, (req, res, ctx) => {
    console.log('Hey making a req');

    return res(ctx.status(200), ctx.json({}));
  }),
];
