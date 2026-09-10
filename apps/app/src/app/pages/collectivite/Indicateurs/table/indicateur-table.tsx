import { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import { getIndicateurPeriodPresentation } from '@/app/indicateurs/valeurs/indicateur-period-presentation';
import { appLabels } from '@/app/labels/catalog';
import { Button, ButtonGroup } from '@tet/ui';
import { capitalize } from '@tet/ui/labels/plural';
import { OpenState } from '@tet/ui/utils/types';
import { useState } from 'react';
import { IndicateurChartInfo } from '../data/use-indicateur-chart';
import { SourceType } from '../types';
import { EditValeursModal } from './edit-valeurs-modal';
import { IndicateurValeursTable } from './indicateur-valeurs-table';
import { PrivateModeSwitch } from './private-mode-switch';

type IndicateurTableProps = {
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
  const [selectedType, setSelectedType] = useState<SourceType>('resultat');
  const { resultats, objectifs } = chartInfo.data.valeurs;

  // compte les données disponibles pour chaque type
  const sourcesCount = {
    objectif: objectifs.sources.length,
    resultat: resultats.sources.length,
  };

  // Si l'onglet préféré n'a aucune donnée, affiche l'autre sans synchroniser
  // un état dérivé dans un effet. Le choix explicite reste ainsi conservé.
  const fallbackType = selectedType === 'resultat' ? 'objectif' : 'resultat';
  const type =
    !chartInfo.isLoading &&
    !sourcesCount[selectedType] &&
    sourcesCount[fallbackType]
      ? fallbackType
      : selectedType;
  const typeInverse = type === 'resultat' ? 'objectif' : 'resultat';
  const data = type === 'resultat' ? resultats : objectifs;

  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = openModalState?.isOpen ?? internalIsOpen;
  const setIsOpen = openModalState?.setIsOpen ?? setInternalIsOpen;
  const periodPresentation = getIndicateurPeriodPresentation(
    definition.periodicite
  );

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
              children: capitalize(
                appLabels.indicateurResultat({ plural: true })
              ),
              disabled: !sourcesCount.resultat,
              onClick: () => setSelectedType('resultat'),
            },
            {
              id: 'objectif',
              children: capitalize(
                appLabels.indicateurObjectif({ plural: true })
              ),
              disabled: !sourcesCount.objectif,
              onClick: () => setSelectedType('objectif'),
            },
          ]}
        />
        {/** pour ouvrir le dialogue d'édition des valeurs */}
        {chartInfo.sourceFilter.avecDonneesCollectivite && !readonly && (
          <Button size="sm" onClick={() => setIsOpen(true)}>
            {periodPresentation.editor.addLabel}
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
          openState={{ isOpen, setIsOpen }}
          data={data}
        />
      )}
    </div>
  );
};
