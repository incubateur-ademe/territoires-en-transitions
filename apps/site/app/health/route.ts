// Sonde du HEALTHCHECK Docker : ne dépend ni de Strapi ni de la base stats,
// contrairement à la home SSR.
export function GET() {
  return new Response('ok');
}
