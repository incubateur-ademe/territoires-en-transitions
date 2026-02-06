'use client';

import ListeActions from '@/panier/components/ListeActions';
import PanierActions from '@/panier/components/PanierActions';
import {
  useCollectiviteContext,
  usePanierContext,
  useUserContext,
} from '@/panier/providers';
import { Panier, PanierAPI, useSupabase } from '@tet/api';
import { Event, useEventTracker } from '@tet/ui';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ContenuListesFiltre, PanierOngletName } from '../FiltresActions/types';
import { useAjouterActionsRealiseesOuEnCoursState } from '../PanierActions/useAjouterActionsRealiseesOuEnCoursState';
import { PartagerLeLien } from './PartagerLeLien';

type PanierRealtimeProps = {
  panier: Panier;
} & ContenuListesFiltre;

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
  typologies,
}: PanierRealtimeProps) => {
  const [currentTab, setCurrentTab] = useState<PanierOngletName>('selection');
  const ajouterActionsRealiseesOuEnCours =
    useAjouterActionsRealiseesOuEnCoursState();

  const router = useRouter();
  const { setCollectiviteId } = useCollectiviteContext();
  const { setPanier } = usePanierContext();
  const { setUser } = useUserContext();

  const tracker = useEventTracker();

  const supabase = useSupabase();
  const panierAPI = useMemo(() => new PanierAPI(supabase), [supabase]);

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
  }, [router, panier.id, setUser, panierAPI, supabase]);

  const handleToggleSelected = async (actionId: number, selected: boolean) => {
    if (selected) {
      await panierAPI.addActionToPanier(actionId, panier.id);
      await tracker(Event.panier.clickAjout, {
        collectivite_preset: panier.collectivite_preset,
        onglet: currentTab,
        panier_id: panier.id,
        action_id: actionId,
      });
      router.refresh();
    } else {
      await panierAPI.removeActionFromPanier(actionId, panier.id);
      await tracker(Event.panier.clickRetrait, {
        collectivite_preset: panier.collectivite_preset,
        onglet: currentTab,
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

    // ajoute/enlève l'action du panier si la case à cocher "Ajouter les
    // actions classées <statut>" est activée
    const inpanier = panier.inpanier.find((a) => a.id === actionId);
    if (!inpanier) {
      if (
        (statusId === 'en_cours' &&
          ajouterActionsRealiseesOuEnCours.ajoutEnCours) ||
        (statusId === 'realise' &&
          ajouterActionsRealiseesOuEnCours.ajoutRealisees)
      ) {
        await panierAPI.addActionToPanier(actionId, panier.id);
      }
    }
    if (inpanier && inpanier.statut !== statusId) {
      if (
        (inpanier.statut === 'en_cours' &&
          ajouterActionsRealiseesOuEnCours.ajoutEnCours) ||
        (inpanier.statut === 'realise' &&
          ajouterActionsRealiseesOuEnCours.ajoutRealisees)
      ) {
        await panierAPI.removeActionFromPanier(actionId, panier.id);
      }
    }

    await tracker(Event.panier.changeStatut, {
      onglet: currentTab,
      collectivite_preset: panier.collectivite_preset,
      panier_id: panier.id,
      action_id: actionId,
      category_id: statusId,
    });

    router.refresh();
  };

  const handleChangeTab = async (tab: PanierOngletName) => {
    setCurrentTab(tab);
    await tracker(Event.panier.selectTab, {
      collectiviteId: panier.collectivite_preset,
      panier_id: panier.id,
      onglet: tab,
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
          panier={panier}
          onToggleSelected={handleToggleSelected}
          onUpdateStatus={handleUpdateStatus}
          onChangeTab={handleChangeTab}
          {...{
            budgets,
            temps,
            thematiques,
            typologies,
          }}
        />
      </div>

      <PanierActions
        panier={panier}
        budgets={budgets}
        ajouterActionsRealiseesOuEnCours={ajouterActionsRealiseesOuEnCours}
        onToggleSelected={handleToggleSelected}
      />

      <PartagerLeLien panier={panier} />
    </div>
  );
};

export default PanierRealtime;
