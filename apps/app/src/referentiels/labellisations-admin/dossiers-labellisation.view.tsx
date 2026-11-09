'use client';

import { useState } from 'react';
import { appLabels } from '@/app/labels/catalog';
import PictoDashboard from '@/app/ui/pictogrammes/PictoDashboard';
import { ErrorCard } from '@/app/utils/error/error.card';
import { DossierLabellisationSidePanel } from './dossier/dossier-labellisation.side-panel';
import { useListDossiersLabellisation } from './data/use-dossiers-labellisation';
import {
  useFilterDossiersLabellisation,
  DossiersView,
} from './dossiers-labellisation.header-filters';
import { DossiersLabellisationTable } from './dossiers-labellisation.table';
import {
  filterAndSortDossiers,
  isActionRequired,
} from './labellisations-admin.utils';

const emptyTitleByView: Record<DossiersView, string> = {
  'en-attente': appLabels.labellisationsAdminAucunDossierEnAttente,
  'en-cours': appLabels.labellisationsAdminAucunDossierEnCours,
  clos: appLabels.labellisationsAdminAucunDossierClos,
};

export const DossiersLabellisationView = ({ view }: { view: DossiersView }) => {
  const { filters, setFilters } = useFilterDossiersLabellisation();
  const search = filters.search || undefined;
  const { data, isLoading, isError, refetch } = useListDossiersLabellisation(
    view === 'clos' ? { statuts: ['clos'], search } : { search }
  );
  // Un dossier vu « en attente » y reste jusqu'au changement d'onglet : sinon
  // la ligne (et sa modale d'attribution) disparaît dès le 1er auditeur, et on
  // ne peut pas en attribuer un second.
  // Retenus en état, ajustés au rendu (pas de ref lue pendant le rendu).
  const [enAttenteIds, setEnAttenteIds] = useState<ReadonlySet<number>>(
    new Set()
  );
  if (view === 'en-attente' && data) {
    const nouveaux = data
      .filter((d) => isActionRequired(d) && !enAttenteIds.has(d.auditId))
      .map((d) => d.auditId);
    if (nouveaux.length > 0) {
      setEnAttenteIds(new Set([...enAttenteIds, ...nouveaux]));
    }
  }
  // Les dossiers ouverts se partagent entre « en attente » et « en cours ».
  const dossiersDeLaVue =
    view === 'clos'
      ? data
      : data?.filter((dossier) => {
          const isEnAttente =
            isActionRequired(dossier) ||
            (dossier.statut !== 'clos' && enAttenteIds.has(dossier.auditId));
          return isEnAttente === (view === 'en-attente');
        });
  const dossiers = filterAndSortDossiers(dossiersDeLaVue ?? [], filters);
  const hasFilters =
    !!search || filters.sujets.length > 0 || filters.statuts.length > 0;

  return (
    <>
      <DossierLabellisationSidePanel />
      {isError ? (
        <ErrorCard
          title={appLabels.uneErreurEstSurvenue}
          retry={() => refetch()}
        />
      ) : (
        <DossiersLabellisationTable
          dossiers={dossiers}
          isLoading={isLoading}
          view={view}
          emptyCard={{
            picto: (props) => <PictoDashboard {...props} />,
            title: hasFilters
              ? appLabels.labellisationsAdminAucunDossier
              : emptyTitleByView[view],
            actions: hasFilters
              ? [
                  {
                    children: appLabels.reinitialiserLesFiltres,
                    onClick: () => setFilters(null),
                    variant: 'outlined',
                    size: 'sm',
                  },
                ]
              : [],
          }}
        />
      )}
    </>
  );
};
