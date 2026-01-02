import IndicateurCard from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCard';
import { getIndicateurGroup } from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/utils';
import { makeCollectiviteIndicateursUrl } from '@/app/app/paths';
import { IndicateurDefinitionListItem } from '@/app/indicateurs/indicateurs/use-list-indicateurs';
import { Button } from '@tet/ui';

type Props = {
  collectiviteId: number;
  indicateurs: IndicateurDefinitionListItem[];
  isReadonly: boolean;
  isEditable: boolean;
  onToggleSelection: (indicateur: IndicateurDefinitionListItem) => void;
};

export const AxeIndicateursList = (props: Props) => {
  const {
    collectiviteId: externalCollectiviteId,
    indicateurs,
    isReadonly,
    isEditable,
    onToggleSelection,
  } = props;

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-3">
      {indicateurs.map((indicateur) => (
        <IndicateurCard
          key={`${indicateur.id}-${indicateur.titre}`}
          readonly={isReadonly}
          definition={indicateur}
          externalCollectiviteId={externalCollectiviteId}
          isEditable={isEditable}
          href={makeCollectiviteIndicateursUrl({
            collectiviteId: externalCollectiviteId,
            indicateurView: getIndicateurGroup(
              indicateur.identifiantReferentiel
            ),
            indicateurId: indicateur.id,
            identifiantReferentiel: indicateur.identifiantReferentiel,
          })}
          selectState={{
            // Dissocier
            selected: true,
            setSelected: (i) => onToggleSelection(i),
          }}
          otherMenuActions={(indicateur) => [
            <Button
              key={indicateur.id}
              onClick={() => onToggleSelection(indicateur)} // Ajouter
              icon="link-unlink"
              title="Dissocier l'indicateur"
              size="xs"
              variant="grey"
            />,
          ]}
        />
      ))}
    </div>
  );
};
