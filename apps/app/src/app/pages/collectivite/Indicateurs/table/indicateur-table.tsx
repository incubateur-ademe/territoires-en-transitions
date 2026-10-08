import { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import { appLabels } from '@/app/labels/catalog';
import { ButtonGroup } from '@tet/ui';
import { capitalize } from '@tet/ui/labels/plural';
import { OpenState } from '@tet/ui/utils/types';
import { useState } from 'react';
import { prepareIndicateurPeriodeData } from '../data/prepare-indicateur-periode-data';
import { IndicateurChartInfo } from '../data/use-indicateur-chart';
import { SourceType } from '../types';
import { IndicateurValeursTable } from './indicateur-valeurs-table';
import { PrivateModeSwitch } from './private-mode-switch';
import { useIndicateurTableDeclaration } from './use-indicateur-table-declaration';

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
  const [typeChoisi, setType] = useState<SourceType>('resultat');
  const annualData = chartInfo.data.valeurs;
  const resultats = prepareIndicateurPeriodeData(annualData.resultats);
  const objectifs = prepareIndicateurPeriodeData(annualData.objectifs);

  // compte les données disponibles pour chaque type
  const sourcesCount = {
    objectif: objectifs.sources.length,
    resultat: resultats.sources.length,
  };

  // détermine si il y a des données pour l'onglet sélectionné
  const typeInverse = typeChoisi === 'resultat' ? 'objectif' : 'resultat';
  const shouldChange = !sourcesCount[typeChoisi] && sourcesCount[typeInverse];

  // bascule sur l'autre onglet si l'onglet choisi n'a rien à afficher. Déduit
  // pendant le rendu : un effet qui corrigeait l'état affichait d'abord
  // l'onglet vide.
  const type = shouldChange && !chartInfo.isLoading ? typeInverse : typeChoisi;

  const data = type === 'resultat' ? resultats : objectifs;
  const hasFilledCollectiviteResultat = Boolean(
    resultats.donneesCollectivite?.valeurs.some(
      ({ valeur }) => typeof valeur === 'number'
    )
  );
  const canWrite =
    !readonly &&
    !definition.sansValeurUtilisateur &&
    chartInfo.sourceFilter.avecDonneesCollectivite;
  const declaration = useIndicateurTableDeclaration({
    canWrite,
    collectiviteId,
    definition,
    existingPeriodes: [...resultats.periodes, ...objectifs.periodes],
    openModalState,
  });

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
              onClick: () => setType('resultat'),
            },
            {
              id: 'objectif',
              children: capitalize(
                appLabels.indicateurObjectif({ plural: true })
              ),
              disabled: !sourcesCount.objectif,
              onClick: () => setType('objectif'),
            },
          ]}
        />
      </div>
      {/** tableau pour le type de valeurs (objectif | résultat) sélectionné */}
      <IndicateurValeursTable
        {...props}
        data={data}
        type={type}
        readonly={!canWrite}
        addPeriode={declaration.header}
        disableComments={!chartInfo.sourceFilter.avecDonneesCollectivite}
      />
      {/** résultat récent en mode privé */}
      {type === 'resultat' && hasFilledCollectiviteResultat && (
        <PrivateModeSwitch definition={definition} isReadOnly={readonly} />
      )}
    </div>
  );
};
