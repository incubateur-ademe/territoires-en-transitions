import { CookieOptionsWithName } from '@supabase/ssr';

export const supabaseCookieOptions: CookieOptionsWithName = {
  domain:
    process.env.NODE_ENV === 'production'
      ? '.territoiresentransitions.fr'
      : '.localhost',
};
