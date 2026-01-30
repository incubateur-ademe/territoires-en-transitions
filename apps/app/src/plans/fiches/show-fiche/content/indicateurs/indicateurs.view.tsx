import IndicateurCard from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCard';
import { getIndicateurGroup } from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/utils';
import { makeCollectiviteIndicateursUrl } from '@/app/app/paths';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Button, useEventTracker } from '@tet/ui';
import { Event } from '@tet/ui/components/tracking/posthog-events';
import { useState } from 'react';
import { useFicheContext } from '../../context/fiche-context';
import { SharedFicheLinkedResourcesAlert } from '../../share-fiche/shared-fiche-linked-resources.alert';
import { ContentLayout } from '../content-layout';
import { useFicheSidePanel } from '../use-fiche-side-panel';
import { CreateIndicateurModal } from './create-indicateur.modal';
import { DatavizPicto } from './empty-view/dataviz-picto';
import {
  createIndicateurButtonProps,
  linkIndicateursButtonProps,
} from './indcateur-actions.button-props';

export const IndicateursView = () => {
  const { indicateurs, isReadonly, fiche } = useFicheContext();
  const collectivite = useCurrentCollectivite();
  const [isCreateIndicateurModalOpen, setIsCreateIndicateurModalOpen] =
    useState(false);
  const { openPanel } = useFicheSidePanel();
  const tracker = useEventTracker();

  const toggleCreateIndicateurModal = () => {
    tracker(Event.indicateurs.createIndicateurPerso);
    setIsCreateIndicateurModalOpen((prev) => !prev);
  };

  return (
    <>
      <SharedFicheLinkedResourcesAlert
        fiche={fiche}
        currentCollectiviteId={collectivite.collectiviteId}
        sharedDataTitle="Indicateurs associés"
        sharedDataDescription="Les indicateurs et les données affichées correspondent à ceux de cette collectivité."
      />
      <CreateIndicateurModal
        isOpen={isCreateIndicateurModalOpen}
        setIsOpen={setIsCreateIndicateurModalOpen}
        fiche={fiche}
      />

      <ContentLayout.Root>
        <ContentLayout.SharedAlert
          fiche={fiche}
          collectiviteId={collectivite.collectiviteId}
          title="Indicateurs associés"
          description="Les indicateurs et les données affichées correspondent à ceux de cette collectivité."
        />
        <ContentLayout.Empty
          isReadonly={isReadonly}
          picto={(props) => <DatavizPicto {...props} />}
          title="Aucun indicateur associé !"
          subTitle="Mesurez les résultats et l'impact de l'action grâce à des indicateurs"
          actions={[
            {
              ...createIndicateurButtonProps,
              onClick: toggleCreateIndicateurModal,
              isVisible: indicateurs.canCreate,
            },
            {
              ...linkIndicateursButtonProps,
              onClick: () => openPanel('indicateurs', fiche),
            },
          ]}
        />
        <ContentLayout.Content
          data={indicateurs.list}
          isLoading={indicateurs.isLoading}
          actions={
            <>
              {indicateurs.canCreate && (
                <Button
                  {...createIndicateurButtonProps}
                  onClick={toggleCreateIndicateurModal}
                />
              )}

              {!isReadonly && (
                <Button
                  {...linkIndicateursButtonProps}
                  onClick={() => openPanel('indicateurs', fiche)}
                />
              )}
            </>
          }
        >
          {(indicateur) => (
            <IndicateurCard
              key={`${indicateur.id}-${indicateur.titre}`}
              readonly={isReadonly}
              definition={indicateur}
              externalCollectiviteId={fiche.collectiviteId}
              isEditable={indicateurs.canUpdate(indicateur)}
              href={makeCollectiviteIndicateursUrl({
                collectiviteId: fiche.collectiviteId,
                indicateurView: getIndicateurGroup(
                  indicateur.identifiantReferentiel
                ),
                indicateurId: indicateur.id,
                identifiantReferentiel: indicateur.identifiantReferentiel,
              })}
              selectState={{
                selected: true,
                setSelected: (i) => indicateurs.update(i),
              }}
              otherMenuActions={(indicateur) => [
                <Button
                  key={indicateur.id}
                  onClick={() => indicateurs.update(indicateur)}
                  icon="link-unlink"
                  title="Dissocier l'indicateur"
                  size="xs"
                  variant="grey"
                />,
              ]}
            />
          )}
        </ContentLayout.Content>
      </ContentLayout.Root>
    </>
  );
};
