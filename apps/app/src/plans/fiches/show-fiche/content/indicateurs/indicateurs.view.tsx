import IndicateurCard from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCard';
import { getIndicateurGroup } from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/utils';
import { makeCollectiviteIndicateursUrl } from '@/app/app/paths';
import { IndicateurDefinitionListItem } from '@/app/indicateurs/definitions/use-list-indicateur-definitions';
import { Button } from '@tet/ui';
import { useFicheContext } from '../../context/fiche-context';
import { LinkedResources } from '../linked-resources-layout';
import { ActionButtons } from './action.buttons';
import { CreateIndicateurModal } from './create-indicateur.modal';
import { DatavizPicto } from './empty-view/dataviz-picto';
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

  return (
    <>
      <CreateIndicateurModal
        isOpen={indicateurAction === 'creating'}
        setIsOpen={() => toggleIndicateurAction('creating')}
        fiche={fiche}
      />

      <IndicateursSideMenu />

      <LinkedResources.Root>
        <LinkedResources.SharedAlert
          title="Indicateurs associés"
          description="Les indicateurs et les données affichées correspondent à ceux de cette collectivité."
        />
        <LinkedResources.Empty
          picto={(props) => <DatavizPicto {...props} />}
          title="Aucun indicateur associé !"
          subTitle="Mesurez les résultats et l'impact de l'action grâce à des indicateurs"
          actions={[<ActionButtons key="actions" />]}
        />
        <LinkedResources.Content
          data={selectedIndicateurs}
          isLoading={isLoadingIndicateurs}
          actions={<ActionButtons />}
        >
          {(indicateur: IndicateurDefinitionListItem) => (
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
                selected: true,
                setSelected: (i) => updateIndicateurs(i),
              }}
              otherMenuActions={(indicateur) => [
                <Button
                  key={indicateur.id}
                  onClick={() => updateIndicateurs(indicateur)}
                  icon="link-unlink"
                  title="Dissocier l'indicateur"
                  size="xs"
                  variant="grey"
                />,
              ]}
            />
          )}
        </LinkedResources.Content>
      </LinkedResources.Root>
    </>
  );
};
