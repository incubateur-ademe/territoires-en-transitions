import { Button, ButtonGroup } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { useEffect, useState } from 'react';
import { IndicateurChartInfo } from '../data/use-indicateur-chart';
import { SourceType, TIndicateurDefinition } from '../types';
import { EditValeursModal } from './edit-valeurs-modal';
import { IndicateurValeursTable } from './indicateur-valeurs-table';
import { PrivateModeSwitch } from './private-mode-switch';

export type IndicateurTableProps = {
  chartInfo: IndicateurChartInfo;
  collectiviteId: number;
  definition: TIndicateurDefinition;
  readonly?: boolean;
  confidentiel?: boolean;
  openModalState?: OpenState;
};

/**
 * Affiche les boutons et le tableau des valeurs d'un indicateur
 */
export const IndicateurTable = (props: IndicateurTableProps) => {
  const { chartInfo, collectiviteId, definition, readonly, openModalState } =
    props;

  const [type, setType] = useState<SourceType>('resultat');
  const data =
    type === 'resultat'
      ? chartInfo.data.valeurs.resultats
      : chartInfo.data.valeurs.objectifs;

  const [isOpen, setIsOpen] = useState(openModalState?.isOpen ?? false);

  useEffect(() => {
    setIsOpen(openModalState?.isOpen ?? false);
  }, [openModalState?.isOpen]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex">
        {/** bascule entre résultats et objectifs */}
        <ButtonGroup
          size="sm"
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
        {chartInfo.sourceFilter.avecDonneesCollectivite && (
        <Button size="sm" onClick={() => setIsOpen(true)} disabled={readonly}>
          Ajouter une année
        </Button>
        )}
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
          openState={{
            isOpen,
            setIsOpen: (value) => {
              setIsOpen(value);
              openModalState?.setIsOpen(value);
            },
          }}
          data={data}
        />
      )}
    </div>
  );
};
