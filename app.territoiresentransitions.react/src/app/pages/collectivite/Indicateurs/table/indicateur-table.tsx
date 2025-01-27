import { Button, ButtonGroup } from '@/ui';
import { useState } from 'react';
import { prepareData } from '../data/prepare-data';
import { useIndicateurValeurs } from '../data/use-indicateur-valeurs';
import { SourceType, TIndicateurDefinition } from '../types';
import { EditValeursModal } from './edit-valeurs-modal';
import { IndicateurValeursTable } from './indicateur-valeurs-table';
import { PrivateModeSwitch } from './private-mode-switch';

export type IndicateurTableProps = {
  collectiviteId: number;
  definition: TIndicateurDefinition;
  readonly?: boolean;
  confidentiel?: boolean;
};

/**
 * Affiche les boutons et le tableau des valeurs d'un indicateur
 */
export const IndicateurTable = (props: IndicateurTableProps) => {
  const { collectiviteId, definition, readonly } = props;
  const { data: valeurs } = useIndicateurValeurs({
    collectiviteId,
    indicateurIds: [definition.id],
  });

  const [type, setType] = useState<SourceType>('resultat');
  const rawData = valeurs?.indicateurs?.[0];
  const data = prepareData(rawData, type);

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex">
        {/** bascule entre résultats et objectifs */}
        <ButtonGroup
          size="xs"
          activeButtonId={type}
          buttons={[
            {
              id: 'resultat',
              children: 'Mes résultats',
              onClick: () => setType('resultat'),
            },
            {
              id: 'objectif',
              children: 'Mes objectifs',
              onClick: () => setType('objectif'),
            },
          ]}
        />
        {/** pour ouvrir le dialogue d'édition des valeurs */}
        <Button size="xs" onClick={() => setIsOpen(true)} disabled={readonly}>
          Ajouter une année
        </Button>
      </div>
      {/** tableau pour le type de valeurs (objectif | résultat) sélectionné */}
      <IndicateurValeursTable {...props} data={data} type={type} />
      {/** résultat récent en mode privé */}
      {type === 'resultat' && <PrivateModeSwitch definition={definition} />}
      {/** dialogue d'édition des valeurs */}
      {isOpen && (
        <EditValeursModal
          collectiviteId={collectiviteId}
          definition={definition}
          openState={{ isOpen, setIsOpen }}
          data={data}
        />
      )}
    </div>
  );
};
