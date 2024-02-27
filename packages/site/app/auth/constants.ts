// redirection par défaut après login ou signup vers la home de l'app.
export const DEFAULT_REDIRECT =
  process.env.NODE_ENV === 'production'
    ? 'https://app.territoiresentransitions.fr'
    : 'http://localhost:3000';
