import {createContext, ReactNode, useContext, useRef} from 'react';
import {useQueryClient} from 'react-query';
import {RealtimeChannel} from '@supabase/supabase-js';
import {supabaseClient} from 'core-logic/api/supabase';

type TScoreListenerContext = {
  subscribe: (collectiviteId: number | null) => void;
};

type TContextData = {
  subscription: RealtimeChannel;
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

      const table = {schema: 'public', table: 'client_scores'};
      const subscription = supabaseClient
        .channel(
          `public:client_scores:collectivite_id=eq.${collectiviteId}` // ,referentiel=eq.${referentiel}
        )
        .on('postgres_changes', {event: 'INSERT', ...table}, refetch)
        .on('postgres_changes', {event: 'UPDATE', ...table}, refetch)
        .subscribe();
      contextDataRef.current = {
        collectiviteId,
        subscription,
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
