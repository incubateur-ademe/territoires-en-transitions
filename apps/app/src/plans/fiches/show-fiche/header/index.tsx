import { appLabels } from '@/app/labels/catalog';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { PageHeader } from '@tet/ui';
import { uiLabels } from '@tet/ui/labels/catalog';
import { ReactElement, ReactNode } from 'react';
import { FicheContextValue, useFicheContext } from '../context/fiche-context';
import {
  FicheNavigationButtons,
  FicheNavigationLinks,
} from '../navigation/fiche-navigation.buttons';
import { Breadcrumbs } from './breadcrumbs';
import { EditionModalManagerProvider } from './context/edition-modal-manager-context';
import { EditionModalRenderer } from './context/edition-modal-renderer';
import { Menu } from './menu';
import { SubHeader } from './subheader';

const FicheHeaderShell = ({
  fiche,
  planId,
  children,
}: {
  fiche: FicheContextValue['fiche'];
  planId: FicheContextValue['planId'];
  children: ReactNode;
}): ReactElement => (
  <EditionModalManagerProvider>
    {children}
    <EditionModalRenderer fiche={fiche} planId={planId} />
  </EditionModalManagerProvider>
);

export const Header = ({
  navigation,
}: {
  navigation?: FicheNavigationLinks;
}): ReactElement => {
  const { fiche, isReadonly, planId, update } = useFicheContext();
  const { collectiviteId, hasCollectivitePermission } =
    useCurrentCollectivite();
  const { titre, axes } = fiche;

  const updateTitle = (titre: string | null): void => {
    update({
      ficheId: fiche.id,
      ficheFields: { titre },
    });
  };

  return (
    <FicheHeaderShell fiche={fiche} planId={planId}>
      <PageHeader>
        <PageHeader.EditableTitle
          title={titre}
          isReadonly={isReadonly}
          onUpdate={updateTitle}
        />
        <PageHeader.Actions>
          <div className="flex items-center gap-2">
            {navigation && (
              <PageHeader.Navigation label={appLabels.ficheNavigation}>
                <FicheNavigationButtons {...navigation} />
              </PageHeader.Navigation>
            )}
            <Menu />
          </div>
        </PageHeader.Actions>

        {hasCollectivitePermission('plans.read') && (
          <PageHeader.Subtitle>
            <Breadcrumbs
              title={titre ?? uiLabels.sansTitre}
              collectiviteId={collectiviteId}
              axes={axes ?? []}
              planId={planId}
            />
          </PageHeader.Subtitle>
        )}

        <PageHeader.Metadata>
          <SubHeader fiche={fiche} collectiviteId={collectiviteId} />
        </PageHeader.Metadata>
      </PageHeader>
    </FicheHeaderShell>
  );
};
