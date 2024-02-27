export * from './Login';
export * from './LoginModal';
export * from './SessionProvider';
export * from './type';

export const DOMAIN =
  process.env.NODE_ENV === 'production'
    ? 'territoiresentransitions.fr'
    : 'localhost';
