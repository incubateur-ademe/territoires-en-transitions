import { IndicateurDefinition } from '@/app/indicateurs/definitions/use-get-indicateur-definition';
import { Button, ButtonGroup } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { useEffect, useState } from 'react';
import { IndicateurChartInfo } from '../data/use-indicateur-chart';
import { SourceType } from '../types';
import { EditValeursModal } from './edit-valeurs-modal';
import { IndicateurValeursTable } from './indicateur-valeurs-table';
import { PrivateModeSwitch } from './private-mode-switch';

export type IndicateurTableProps = {
  chartInfo: IndicateurChartInfo;
  collectiviteId: number;
  definition: IndicateurDefinition;
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
  const { resultats, objectifs } = chartInfo.data.valeurs;
  const data = type === 'resultat' ? resultats : objectifs;

  const [isOpen, setIsOpen] = useState(openModalState?.isOpen ?? false);

  useEffect(() => {
    setIsOpen(openModalState?.isOpen ?? false);
  }, [openModalState?.isOpen]);

  // compte les données disponibles pour chaque type
  const sourcesCount = {
    objectif: objectifs.sources.length,
    resultat: resultats.sources.length,
  };

  // détermine si il y a des données pour l'onglet sélectionné
  const typeInverse = type === 'resultat' ? 'objectif' : 'resultat';
  const shouldChange = !sourcesCount[type] && sourcesCount[typeInverse];

  // change d'onglet si il n'y a pas de données à afficher
  // mais qu'il y a des données pour l'autre onglet
  useEffect(() => {
    if (shouldChange && !chartInfo.isLoading) {
      setType(typeInverse);
    }
  }, [shouldChange, typeInverse, chartInfo.isLoading]);

  // n'affiche rien si il n'y a pas de données
  if (!sourcesCount[type] && !sourcesCount[typeInverse]) return;

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
              children: 'Résultats',
              disabled: !sourcesCount.resultat,
              onClick: () => setType('resultat'),
            },
            {
              id: 'objectif',
              children: 'Objectifs',
              disabled: !sourcesCount.objectif,
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
      <IndicateurValeursTable
        {...props}
        data={data}
        type={type}
        disableComments={!chartInfo.sourceFilter.avecDonneesCollectivite}
      />
      {/** résultat récent en mode privé */}
      {type === 'resultat' && !!data.donneesCollectivite?.valeurs.length && (
        <PrivateModeSwitch definition={definition} isReadOnly={readonly} />
      )}
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
