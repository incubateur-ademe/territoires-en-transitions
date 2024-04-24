/* eslint-disable react/no-unescaped-entities */
'use client';

import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {
  ActionImpactFourchetteBudgetaire,
  ActionImpactTempsMiseEnOeuvre,
  ActionImpactThematique,
  Panier,
} from '@tet/api';
import {Alert, PanierOngletName, useEventTracker, useOngletTracker} from '@tet/ui';
import {panierAPI, supabase} from 'src/clientAPI';
import ListeActions from '@components/ListeActions';
import PanierActions from '@components/PanierActions';
import {
  useCollectiviteContext,
  usePanierContext,
  useUserContext,
} from 'providers';

type PanierRealtimeProps = {
  panier: Panier;
  budgets: ActionImpactFourchetteBudgetaire[];
  temps: ActionImpactTempsMiseEnOeuvre[];
  thematiques: ActionImpactThematique[];
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
}: PanierRealtimeProps) => {
  const [currentTab, setCurrentTab] = useState<PanierOngletName>('selection');
  const [openAlert, setOpenAlert] = useState(true);

  const router = useRouter();
  const {setCollectiviteId} = useCollectiviteContext();
  const {setPanier} = usePanierContext();
  const {setUser} = useUserContext();

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
      // @ts-ignore
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
    statusId: string | null,
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
      <div className="lg:w-3/5 xl:w-2/3 py-12 max-lg:pb-2 flex flex-col">
        <Alert
          isOpen={openAlert}
          onClose={() => setOpenAlert(false)}
          title="Contenu en cours de validation par l’ADEME et en amélioration continue"
          classname="mb-8 -mt-4"
        />
        <h1 className="mb-4">
          Initiez <span className="text-primary">des actions impactantes</span>{' '}
          et valorisez le chemin déjà parcouru
        </h1>
        <p className="text-grey-9 text-lg font-medium mt-0 mb-2">
          Ajoutez les actions à votre panier. Vous pouvez aussi les classer en
          fonction de leur état d'avancement.
        </p>
        <ListeActions
          actionsListe={panier.states}
          onToggleSelected={handleToggleSelected}
          onUpdateStatus={handleUpdateStatus}
          onChangeTab={handleChangeTab}
          {...{budgets, temps, thematiques}}
        />
      </div>

      <PanierActions
        actionsListe={panier.contenu}
        budgets={budgets}
        onToggleSelected={handleToggleSelected}
      />
    </div>
  );
};

export default PanierRealtime;
