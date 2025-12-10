import IndicateurCard from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCard';
import { getIndicateurGroup } from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/utils';
import { makeCollectiviteIndicateursUrl } from '@/app/app/paths';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Button, Spacer } from '@tet/ui';
import { useFicheContext } from '../../context/fiche-context';
import { SharedFicheLinkedResourcesAlert } from '../../share-fiche/shared-fiche-linked-resources.alert';
import { ActionButtons } from './action.buttons';
import { CreateIndicateurModal } from './create-indicateur.modal';
import { EmptyIndicateursView } from './empty-view/empty-indicateurs.view';
import { IndicateursSideMenu } from './side-menu';

export const IndicateursView = () => {
  const {
    updateIndicateurs,
    selectedIndicateurs,
    isLoadingIndicateurs,
    canUpdateIndicateur,
    indicateurAction,
    toggleIndicateurAction,
    isReadonly,
    fiche,
  } = useFicheContext();
  const collectiviteId = useCollectiviteId();
  if (isLoadingIndicateurs) {
    return (
      <div className="h-[24rem] flex">
        <SpinnerLoader className="m-auto" />
      </div>
    );
  }

  const showEmptyView =
    isLoadingIndicateurs === false && selectedIndicateurs?.length === 0;

  return (
    <>
      <SharedFicheLinkedResourcesAlert
        fiche={fiche}
        currentCollectiviteId={collectiviteId}
        sharedDataTitle="Indicateurs associés"
        sharedDataDescription="Les indicateurs et les données affichées correspondent à ceux de cette collectivité."
      />
      <CreateIndicateurModal
        isOpen={indicateurAction === 'creating'}
        setIsOpen={() => toggleIndicateurAction('creating')}
        fiche={fiche}
      />

      <IndicateursSideMenu />

      {showEmptyView ? (
        <EmptyIndicateursView />
      ) : (
        <>
          <div className="flex justify-end gap-2">
            <ActionButtons />
          </div>
          <Spacer height={2} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
            {selectedIndicateurs.map((indicateur) => (
              <IndicateurCard
                key={`${indicateur.id}-${indicateur.titre}`}
                readonly={isReadonly}
                definition={indicateur}
                externalCollectiviteId={fiche.collectiviteId}
                isEditable={canUpdateIndicateur(indicateur)}
                href={makeCollectiviteIndicateursUrl({
                  collectiviteId: fiche.collectiviteId,
                  indicateurView: getIndicateurGroup(
                    indicateur.identifiantReferentiel
                  ),
                  indicateurId: indicateur.id,
                  identifiantReferentiel: indicateur.identifiantReferentiel,
                })}
                selectState={{
                  // Dissocier
                  selected: true,
                  setSelected: (i) => updateIndicateurs(i),
                }}
                otherMenuActions={(indicateur) => [
                  <Button
                    key={indicateur.id}
                    onClick={() => updateIndicateurs(indicateur)} // Ajouter
                    icon="link-unlink"
                    title="Dissocier l'indicateur"
                    size="xs"
                    variant="grey"
                  />,
                ]}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
};
