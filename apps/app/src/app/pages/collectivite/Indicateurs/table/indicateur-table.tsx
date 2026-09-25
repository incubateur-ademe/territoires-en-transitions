import { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';
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
  const { resultats, objectifs } = chartInfo.data.valeurs;

  const [isOpen, setIsOpen] = useState(openModalState?.isOpen ?? false);

  // Suit l'ouverture pilotée par le parent. L'ajuster pendant le rendu, plutôt
  // que dans un effet, évite un rendu où le dialogue est encore fermé.
  const ouvertureParente = openModalState?.isOpen ?? false;
  const [previousOuvertureParente, setPreviousOuvertureParente] =
    useState(ouvertureParente);
  if (previousOuvertureParente !== ouvertureParente) {
    setPreviousOuvertureParente(ouvertureParente);
    setIsOpen(ouvertureParente);
  }

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
        {/** pour ouvrir le dialogue d'édition des valeurs */}
        {chartInfo.sourceFilter.avecDonneesCollectivite && !readonly && (
          <Button size="sm" onClick={() => setIsOpen(true)}>
            {appLabels.ajouterAnnee}
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
