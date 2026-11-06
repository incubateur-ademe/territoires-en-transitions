'use client';

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
import { isActionRequired } from './labellisations-admin.utils';

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
  // Les dossiers ouverts se partagent entre « en attente » et « en cours ».
  const dossiers =
    view === 'clos'
      ? data
      : data?.filter(
          (dossier) => isActionRequired(dossier) === (view === 'en-attente')
        );

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
          dossiers={dossiers ?? []}
          isLoading={isLoading}
          view={view}
          emptyCard={{
            picto: (props) => <PictoDashboard {...props} />,
            title: search
              ? appLabels.labellisationsAdminAucunDossier
              : emptyTitleByView[view],
            actions: search
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
