import {createClient} from '@supabase/supabase-js';
import * as Sentry from '@sentry/react';
import {ENV} from 'environmentVariables';
import {Database} from 'types/database.types';

/**
 * Supabase client
 */
export const supabaseClient = createClient<Database>(
  ENV.supabase_url!,
  ENV.supabase_anon_key!,
  {
    global: {
      // intercepte les requêtes pour traiter les erreurs globalement
      fetch: (...args) => {
        return fetch(...args).then(res => {
          // en cas d'erreur
          if (res.status >= 400) {
            res
              // clone la réponse avant de la consommer
              .clone()
              .json()
              // et log l'erreur dans sentry
              .then(({code, message}) => {
                Sentry.captureException(
                  new Error(`Supabase error ${code}: ${message}`)
                );
              });
          }
          // renvoi la réponse originale
          return res;
        });
      },
    },
    db: {
      schema: 'public',
    },
  }
);

// options pour `useQuery` lorsqu'il s'agit de données qui ne changent pas trop
// souvent (définitions du référentiel etc.)
export const DISABLE_AUTO_REFETCH = {
  refetchOnMount: false,
  refetchOnReconnect: false,
  refetchOnWindowFocus: false,
};
