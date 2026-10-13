'use client';

import { appLabels } from '@/app/labels/catalog';
import { ButtonGroup, PageHeader } from '@tet/ui';
import { backofficeTools } from './backoffice-tools';
import { BackofficeToolsGrid } from './backoffice-tools.grid';
import { BackofficeToolsList } from './backoffice-tools.list';
import { useBackofficeDisplay } from './use-backoffice-display';

export const BackofficeView = () => {
  const [display, setDisplay] = useBackofficeDisplay();

  return (
    <div data-test="backoffice.view">
      <PageHeader className="mb-6">
        <PageHeader.Title>{appLabels.administration}</PageHeader.Title>
        <PageHeader.Actions>
          <ButtonGroup
            size="xs"
            variant="primary"
            label={appLabels.administrationAffichageOutils}
            activeButtonId={display}
            buttons={[
              {
                id: 'grille',
                icon: 'layout-grid-line',
                'aria-label': appLabels.vueGrille,
                title: appLabels.vueGrille,
                onClick: () => setDisplay('grille'),
              },
              {
                id: 'liste',
                icon: 'list-unordered',
                'aria-label': appLabels.vueListe,
                title: appLabels.vueListe,
                onClick: () => setDisplay('liste'),
              },
            ]}
          />
        </PageHeader.Actions>
        <PageHeader.Subtitle>
          <p className="mb-0 text-sm leading-[22px] text-grey-8">
            {appLabels.administrationSousTitre}
          </p>
        </PageHeader.Subtitle>
      </PageHeader>
      {display === 'grille' ? (
        <BackofficeToolsGrid tools={backofficeTools} />
      ) : (
        <BackofficeToolsList tools={backofficeTools} />
      )}
    </div>
  );
};
