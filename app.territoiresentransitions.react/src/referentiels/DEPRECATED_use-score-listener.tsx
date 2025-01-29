import { supabaseClient } from '@/app/core-logic/api/supabase';
import { getScoreRealiseQueryKey } from '@/app/referentiels/actions/useScoreRealise';
import { getScoreQueryKey } from '@/app/referentiels/DEPRECATED_score-hooks';
import { RealtimeChannel } from '@supabase/supabase-js';
import { createContext, ReactNode, useContext, useRef } from 'react';
import { useQueryClient } from 'react-query';

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
  const { collectiviteId: id, subscription } = contextData;
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
export const ScoreListenerProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const contextDataRef = useRef<TContextData>(null);

  const queryClient = useQueryClient();

  // S'inscrit auprès de `client_scores_update` pour recharger
  // scores de `client_scores`.
  const subscribe = (collectiviteId: number | null): void => {
    if (
      collectiviteId &&
      shouldSubscribe(contextDataRef.current, collectiviteId)
    ) {
      // Recharge les données de client_scores après un changement.
      const invalidate = (payload: Record<string, any>) => {
        // La payload de l'environnement de développement (supabase/realtime:v0.25.1) contient la clef record
        // celle de prod les clefs new/old.
        const row = payload.new || payload.record;
        const { collectivite_id, referentiel } = row;
        const keys = [
          getScoreQueryKey(collectivite_id, referentiel),
          getScoreRealiseQueryKey(collectivite_id, referentiel),
        ];
        return Promise.all(
          keys.map((key) => queryClient.invalidateQueries(key))
        );
      };

      // Souscrit aux changements de `client_scores_update` pour la collectivité.
      const table = { schema: 'public', table: 'client_scores_update' };
      const subscription = supabaseClient
        .channel(
          `public:client_scores_update:collectivite_id=eq.${collectiviteId}` // ,referentiel=eq.${referentiel}
        )
        .on('postgres_changes', { event: 'INSERT', ...table }, invalidate)
        .on('postgres_changes', { event: 'UPDATE', ...table }, invalidate)
        .subscribe();
      contextDataRef.current = {
        collectiviteId,
        subscription,
      };
    }
  };

  // les données exposées par le fournisseur de contexte
  const value = { subscribe };

  return (
    <ScoreListenerContext.Provider value={value}>
      {children}
    </ScoreListenerContext.Provider>
  );
};
