'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ActionImpactFourchetteBudgetaire,
  ActionImpactTempsMiseEnOeuvre,
  ActionImpactThematique,
  Panier,
} from '@tet/api';
import { PanierOngletName, useEventTracker, useOngletTracker } from '@tet/ui';
import { panierAPI, supabase } from '@tet/panier/src/clientAPI';
import ListeActions from '@tet/panier/components/ListeActions';
import PanierActions from '@tet/panier/components/PanierActions';
import {
  useCollectiviteContext,
  usePanierContext,
  useUserContext,
} from '@tet/panier/providers';
import {PartagerLeLien} from './PartagerLeLien';

type PanierRealtimeProps = {
  panier: Panier;
  budgets: ActionImpactFourchetteBudgetaire[];
  temps: ActionImpactTempsMiseEnOeuvre[];
  thematiques: ActionImpactThematique[];
  sansFiltreCompetences: boolean;
};

/**
 * La partie client du Panier d'Action à Impact
 *
 * @param panier Le panier passé par la partie server side.
 * @param budgets La liste des budgets pour le filtrage
 * @param temps La liste des temps de mise en oeuvre pour le filtrage
 * @param thematiques La liste des thematiques pour le filtrage
 * @constructor
 */
const PanierRealtime = ({
  panier,
  budgets,
  temps,
  thematiques,
  sansFiltreCompetences,
}: PanierRealtimeProps) => {
  const [currentTab, setCurrentTab] = useState<PanierOngletName>('selection');

  const router = useRouter();
  const { setCollectiviteId } = useCollectiviteContext();
  const { setPanier } = usePanierContext();
  const { setUser } = useUserContext();

  const tracker = useEventTracker('panier/panier', currentTab);
  const ongletTracker = useOngletTracker('panier/panier');

  useEffect(() => {
    setPanier(panier);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panier.latest_update, setPanier]);

  useEffect(() => {
    setCollectiviteId(panier.collectivite_preset);
  }, [panier.collectivite_preset, setCollectiviteId]);

  useEffect(() => {
    const channel = panierAPI.listenToPanierUpdates(panier.id, router.refresh);
    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, panier.id, setUser]);

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

  const handleChangeTab = async (tab: PanierOngletName) => {
    setCurrentTab(tab);
    await ongletTracker(tab, {
      collectivite_preset: panier.collectivite_preset,
      panier_id: panier.id,
    });
  };

  return (
    <div className="grow flex max-lg:flex-col gap-8 max-lg:mb-6 min-h-[101vh]">
      <div className="lg:w-3/5 xl:w-2/3 py-8 max-lg:pb-2 flex flex-col">
        <h1 className="mb-6">
          Initiez <span className="text-primary">des actions impactantes</span>{' '}
          et valorisez le chemin déjà parcouru
        </h1>
        <p className="text-grey-9 text-lg font-medium mb-6">
          {
            "Ajoutez les actions à votre panier. Vous pouvez aussi les classer en fonction de leur état d'avancement."
          }
        </p>
        <ListeActions
          actionsListe={panier.states}
          onToggleSelected={handleToggleSelected}
          onUpdateStatus={handleUpdateStatus}
          onChangeTab={handleChangeTab}
          {...{budgets, temps, thematiques, sansFiltreCompetences}}
        />
      </div>

      <PanierActions
        actionsListe={panier.contenu}
        budgets={budgets}
        onToggleSelected={handleToggleSelected}
      />

      <PartagerLeLien />
    </div>
  );
};

export default PanierRealtime;
