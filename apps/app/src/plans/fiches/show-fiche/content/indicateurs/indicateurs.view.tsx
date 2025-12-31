import IndicateurCard from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCard';
import { getIndicateurGroup } from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/utils';
import { makeCollectiviteIndicateursUrl } from '@/app/app/paths';
import { IndicateurDefinitionListItem } from '@/app/indicateurs/definitions/use-list-indicateur-definitions';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Button } from '@tet/ui';
import { useFicheContext } from '../../context/fiche-context';
import { LinkedResources } from '../linked-resources-layout';
import { ActionButtons } from './action.buttons';
import { CreateIndicateurModal } from './create-indicateur.modal';
import { DatavizPicto } from './empty-view/dataviz-picto';
import { IndicateursSideMenu } from './side-menu';

export const IndicateursView = () => {
  const { fiche, isReadonly, indicateurs } = useFicheContext();
  const collectivite = useCurrentCollectivite();
  return (
    <>
      <CreateIndicateurModal
        isOpen={indicateurs.action === 'creating'}
        setIsOpen={() => indicateurs.toggleAction('creating')}
        fiche={fiche}
      />

      <IndicateursSideMenu />

      <LinkedResources.Root>
        <LinkedResources.SharedAlert
          fiche={fiche}
          collectiviteId={collectivite.collectiviteId}
          title="Indicateurs associés"
          description="Les indicateurs et les données affichées correspondent à ceux de cette collectivité."
        />
        <LinkedResources.Empty
          isReadonly={isReadonly}
          picto={(props) => <DatavizPicto {...props} />}
          title="Aucun indicateur associé !"
          subTitle="Mesurez les résultats et l'impact de l'action grâce à des indicateurs"
          actions={[<ActionButtons key="actions" />]}
        />
        <LinkedResources.Content
          data={indicateurs.list}
          isLoading={indicateurs.isLoading}
          actions={<ActionButtons />}
        >
          {(indicateur: IndicateurDefinitionListItem) => (
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
        </LinkedResources.Content>
      </LinkedResources.Root>
    </>
  );
};
