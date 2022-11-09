import {RealtimeSubscription} from '@supabase/realtime-js';
import {createContext, ReactNode, useContext, useRef} from 'react';
import {useQueryClient} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {Referentiel} from 'types/litterals';
import {ActionScore} from 'types/ClientScore';

type TClientScore = {
  id: number;
  collectivite_id: number;
  referentiel: Referentiel;
  scores: ActionScore[];
  score_created_at: string;
};

type TScoreListenerContext = {
  subscribe: (collectiviteId: number | null) => void;
};

type TContextData = {
  subscription: RealtimeSubscription;
  collectiviteId: number;
} | null;

// crée le contexte
export const ScoreListenerContext = createContext<TScoreListenerContext | null>(
  null
);

const shouldSubscribe = (contextData: TContextData, collectiviteId: number) => {
  // pas encore souscrit
  if (!contextData) {
    return true;
  }

  // déjà souscrit
  const {collectiviteId: id, subscription} = contextData;
  if (subscription && id === collectiviteId) {
    return false;
  }

  // annule la souscription précédente
  if (subscription) {
    subscription.unsubscribe();
  }
  return true;
};

// le hook donnant accès au context
export const useScoreListener = () => useContext(ScoreListenerContext);

// le fournisseur de contexte
export const ScoreListenerProvider = ({children}: {children: ReactNode}) => {
  const contextDataRef = useRef<TContextData>(null);

  const queryClient = useQueryClient();

  // souscrit aux changements de client_scores pour cette collectivite
  const subscribe = (collectiviteId: number | null): void => {
    if (
      collectiviteId &&
      shouldSubscribe(contextDataRef.current, collectiviteId)
    ) {
      // recharge les données après un changement
      const refetch = () => {
        queryClient.invalidateQueries(['client_scores', collectiviteId]);
      };

      contextDataRef.current = {
        collectiviteId,
        subscription: supabaseClient
          .from<TClientScore>(
            `client_scores:collectivite_id=eq.${collectiviteId}` // ,referentiel=eq.${referentiel}
          )
          .on('INSERT', refetch)
          .on('UPDATE', refetch)
          .subscribe(),
      };
    }
  };

  // les données exposées par le fournisseur de contexte
  const value = {subscribe};

  return (
    <ScoreListenerContext.Provider value={value}>
      {children}
    </ScoreListenerContext.Provider>
  );
};
