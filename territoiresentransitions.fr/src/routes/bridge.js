import { readFileSync } from 'fs';

/**
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export function get({ query }) {
  const source = readFileSync('src/content/' + query.get('file'), 'utf-8');

  return { body: source };
}
