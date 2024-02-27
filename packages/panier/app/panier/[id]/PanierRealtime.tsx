/* eslint-disable react/no-unescaped-entities */
'use client';

import PanierActions from './PanierActions';
import ListeActions from './ListeActions';

import {createContext, useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {
  ActionImpactCategorie,
  ActionImpactFourchetteBudgetaire,
  ActionImpactThematique,
  Panier,
} from '@tet/api';
import {panierAPI, supabase} from 'src/clientAPI';
import {useEventTracker} from 'src/tracking/useEventTracker';
import {OngletName} from 'src/tracking/trackingPlan';
import {useOngletTracker} from 'src/tracking/useOngletTracker';
import {ValiderPanierButton} from 'app/panier/[id]/ValiderPanierButton';
import {restoreAuthTokens} from '@tet/site/app/auth/authTokens';

type PanierRealtimeProps = {
  panier: Panier;
  categories: ActionImpactCategorie[];
  budgets: ActionImpactFourchetteBudgetaire[];
  thematiques: ActionImpactThematique[];
};

export const PanierContext = createContext<Panier>({
  id: '',
  collectivite_id: 0,
  collectivite_preset: null,
  private: false,
  action_impact_state: null,
  contenu: [],
  states: [],
  created_at: '',
  created_by: null,
  latest_update: '',
});

const PanierRealtime = ({
  panier,
  categories,
  budgets,
  thematiques,
}: PanierRealtimeProps) => {
  const [currentTab, setCurrentTab] = useState<OngletName>('selection');

  const router = useRouter();

  const tracker = useEventTracker('panier', currentTab);
  const ongletTracker = useOngletTracker('panier');

  useEffect(() => {
    restoreAuthTokens(supabase);
    const channel = panierAPI.listenToPanierUpdates(panier.id, router.refresh);

    return () => {
      // @ts-ignore
      supabase.removeChannel(channel);
    };
  }, [router, panier.id]);

  const handleToggleSelected = async (actionId: number, selected: boolean) => {
    if (selected) {
      await panierAPI.addActionToPanier(actionId, panier.id);
      await tracker('ajout', {
        collectivite_preset: panier.collectivite_preset,
        panier_id: panier.id,
        action_id: actionId,
      });
      router.refresh();
    } else {
      await panierAPI.removeActionFromPanier(actionId, panier.id);
      await tracker('retrait', {
        collectivite_preset: panier.collectivite_preset,
        panier_id: panier.id,
        action_id: actionId,
      });
      router.refresh();
    }
  };

  const handleUpdateStatus = async (
    actionId: number,
    statusId: string | null
  ) => {
    await panierAPI.setActionStatut(actionId, panier.id, statusId);
    await tracker('statut', {
      collectivite_preset: panier.collectivite_preset,
      panier_id: panier.id,
      action_id: actionId,
      category_id: statusId,
    });
    router.refresh();
  };

  const handleChangeTab = async (tab: OngletName) => {
    setCurrentTab(tab);
    await ongletTracker(tab, {
      collectivite_preset: panier.collectivite_preset,
      panier_id: panier.id,
    });
  };

  return (
    <PanierContext.Provider value={panier}>
      <div className="grow flex max-lg:flex-col gap-8 max-lg:mb-6 min-h-[101vh]">
        <div className="lg:w-3/5 xl:w-2/3 py-12 max-lg:pb-2">
          <h1>
            Initiez{' '}
            <span className="text-secondary-1">des actions impactantes</span> et
            valorisez le chemin déjà parcouru
          </h1>
          <p className="text-grey-9 text-lg font-medium mt-8 mb-12">
            Ajoutez les actions à votre panier. Vous pouvez aussi les classer en
            fonction de leur état d'avancement.
          </p>
          <ListeActions
            actionsListe={panier.states}
            onToggleSelected={handleToggleSelected}
            onUpdateStatus={handleUpdateStatus}
            onChangeTab={handleChangeTab}
            {...{budgets, thematiques}}
          />
        </div>

        <PanierActions
          actionsListe={panier.contenu}
          onToggleSelected={handleToggleSelected}
        />
      </div>
    </PanierContext.Provider>
  );
};

export default PanierRealtime;
