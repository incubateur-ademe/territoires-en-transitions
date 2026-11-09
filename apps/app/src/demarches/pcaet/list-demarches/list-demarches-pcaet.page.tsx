'use client';

import {
  makeCollectiviteDemarchePcaetNouveauUrl,
  makeCollectiviteDemarchePcaetRootUrl,
} from '@/app/app/paths';
import { useListDemarchesCouvrantes } from '@/app/demarches/pcaet/data/use-list-demarches-couvrantes';
import { useListDemarchesPcaet } from '@/app/demarches/pcaet/data/use-list-demarches-pcaet';
import { appLabels } from '@/app/labels/catalog';
import PictoDashboard from '@/app/ui/pictogrammes/PictoDashboard';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import {
  DemarcheTypeEnum,
  demarchePcaetStatusValues,
  isDemarchePcaetEnCours,
  type DemarchePcaetCouvrante,
} from '@tet/domain/demarches';
import {
  useDemarcheTracker,
  useTrackDemarcheView,
} from '@/app/demarches/use-demarche-tracker';
import { Button, Event } from '@tet/ui';
import { format, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { ConsulterDemarcheCouvranteButton } from './consulter-demarche-couvrante.button';
import { DemarchePcaetActionsButton } from './demarche-pcaet-actions.button';
import { DemarchesPcaetTable } from './demarches-pcaet.table';
import { PorteParSupraAlert } from './porte-par-supra.alert';
import {
  useFilterDemarchesPcaet,
  type Demarche,
} from './use-filter-demarches-pcaet';

/** Ces écrans sont propres au PCAET : le type est connu. */
const PCAET_TYPE = {
  type: appLabels.demarcheTypeLabels[DemarcheTypeEnum.PCAET],
};

/** Ses démarches, et les dépôts de Supra qui la couvrent. */
type Ligne = Demarche | DemarchePcaetCouvrante;

const isCouvrante = (ligne: Ligne): ligne is DemarchePcaetCouvrante =>
  'porteur' in ligne;

// Un dépôt couvrant s'ouvre sous l'identifiant de son porteur : celui de la
// ligne, comme pour les démarches de la collectivité.
const getDetailUrl = (ligne: Ligne) =>
  makeCollectiviteDemarchePcaetRootUrl({
    collectiviteId: ligne.collectiviteId,
    demarcheId: ligne.id,
  });

const renderActions = (ligne: Ligne) =>
  isCouvrante(ligne) ? (
    <ConsulterDemarcheCouvranteButton demarche={ligne} />
  ) : (
    <DemarchePcaetActionsButton demarche={ligne} />
  );

export const ListDemarchesPcaetPage = () => {
  const router = useRouter();
  const trpc = useTRPC();
  const { collectiviteId, hasCollectivitePermission } =
    useCurrentCollectivite();
  const { data: demarches, isLoading, isError } = useListDemarchesPcaet();
  // Le contexte ne se lit que par qui peut déposer. Le serveur y applique le
  // flag, sauf à la couverture en cours, qui bloque le dépôt dans tous les cas.
  const { data: depotContext } = useQuery(
    trpc.demarches.pcaet.getDepotContext.queryOptions(
      { collectiviteId },
      { enabled: hasCollectivitePermission('demarches.pcaet.mutate') }
    )
  );
  const couvertureEnCours = depotContext?.couvertureEnCours ?? null;
  const { data: couvrantes, isLoading: couvrantesEnAttente } =
    useListDemarchesCouvrantes();
  const lignes = useMemo<Ligne[] | undefined>(
    () => demarches && [...(couvrantes ?? []), ...demarches],
    [demarches, couvrantes]
  );
  const { items, reinitialiserFiltres, ...pilotage } =
    useFilterDemarchesPcaet(lignes);
  const creationUrl = makeCollectiviteDemarchePcaetNouveauUrl({
    collectiviteId,
  });
  const isEmpty =
    demarches?.length === 0 && !couvrantesEnAttente && !couvrantes?.length;

  const track = useDemarcheTracker(null);
  useTrackDemarcheView(Event.demarches.pcaet.listeVue, {
    key: String(collectiviteId),
    enabled: !!demarches && demarches.length > 0,
    properties: {
      nbDemarches: demarches?.length,
      statuts: [...new Set(demarches?.map(({ status }) => status))].sort(),
      aDemarcheEnCours: demarches?.some(({ status }) =>
        isDemarchePcaetEnCours(status)
      ),
    },
  });

  // Sans démarche, ni dépôt d'un Supra qui la couvre, la liste n'a rien à
  // montrer : on va droit à la création.
  useEffect(() => {
    if (isEmpty) {
      router.replace(creationUrl);
    }
  }, [isEmpty, creationUrl, router]);

  if (isLoading || couvrantesEnAttente || isEmpty) {
    return (
      <div className="flex grow items-center justify-center">
        <SpinnerLoader />
      </div>
    );
  }

  if (isError || !demarches) {
    return (
      <div className="flex grow items-center justify-center text-grey-7">
        {appLabels.uneErreurEstSurvenue}
      </div>
    );
  }

  // La création est bloquée tant qu'une démarche est « en cours », la sienne
  // ou le dépôt d'un Supra qui la couvre (même règle que le backend : 409). Un
  // Supra, lui, mène un dépôt par groupe d'EPCI, tant qu'un membre reste libre.
  const hasActiveDemarche = demarches.some((demarche) =>
    isDemarchePcaetEnCours(demarche.status)
  );
  const supraAvecMembres =
    depotContext?.estSupra === true && depotContext.epciCandidats.length > 0;
  const supraPeutDeposer =
    supraAvecMembres &&
    depotContext.epciCandidats.some(({ engagement }) => !engagement);
  const creationBloquee =
    couvertureEnCours !== null ||
    (supraAvecMembres ? !supraPeutDeposer : hasActiveDemarche);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-primary-9 m-0">
          {appLabels.demarcheListeTitre(PCAET_TYPE)}
        </h1>
        <Button
          size="sm"
          disabled={creationBloquee}
          title={
            couvertureEnCours
              ? appLabels.demarcheCreationBloqueeCouverture({
                  porteur: couvertureEnCours.porteur.nom,
                  dateDebut: format(
                    parseISO(couvertureEnCours.dateDebut),
                    'dd/MM/yyyy'
                  ),
                })
              : !creationBloquee
              ? undefined
              : supraAvecMembres
              ? appLabels.demarcheCreationBloqueeTousEngages
              : appLabels.demarcheListeCreationBloquee(PCAET_TYPE)
          }
          onClick={() => {
            track(Event.demarches.pcaet.creerClic, { origine: 'liste' });
            router.push(creationUrl);
          }}
        >
          {appLabels.demarcheListeCommencerDepot}
        </Button>
      </div>
      <PorteParSupraAlert couvrantes={couvrantes} />
      <section className="rounded-xl border border-grey-3 bg-white p-6">
        <DemarchesPcaetTable
          ariaLabel={appLabels.demarcheListeTitre(PCAET_TYPE)}
          demarches={items}
          {...pilotage}
          statutOptions={demarchePcaetStatusValues}
          getDetailUrl={getDetailUrl}
          renderActions={renderActions}
          etatVide={{
            picto: (props) => <PictoDashboard {...props} />,
            title: appLabels.demarcheListeAucunResultat,
            actions: [
              {
                children: appLabels.reinitialiserLesFiltres,
                onClick: reinitialiserFiltres,
                variant: 'outlined',
                size: 'sm',
              },
            ],
          }}
        />
      </section>
    </div>
  );
};
