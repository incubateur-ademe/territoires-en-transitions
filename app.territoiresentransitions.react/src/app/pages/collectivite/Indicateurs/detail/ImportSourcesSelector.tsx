import {useState} from 'react';
import {
  Alert,
  Button,
  Modal,
  ModalFooterOKCancel,
  Tab,
  Tabs,
  TrackPageView,
  useEventTracker,
} from '@tet/ui';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {TIndicateurDefinition} from '../types';
import {SOURCE_COLLECTIVITE} from '../constants';
import {IndicateurImportSource} from './useImportSources';
import {useApplyOpenData, useOpenDataComparaison} from './useApplyOpenData';
import {ApplyOpenDataModal} from './ApplyOpenDataModal';
import {getSourceTypeLabel} from '../constants';

/**
 * Affiche le sélecteur des sources de données d'un indicateur, lorsqu'il
 * y en a plusieurs. Sinon rien n'est affiché.
 */
export const ImportSourcesSelector = ({
  definition,
  sources,
  currentSource,
  setCurrentSource,
}: {
  definition: TIndicateurDefinition;
  sources: IndicateurImportSource[];
  currentSource: string;
  setCurrentSource: (value: string) => void;
}) => {
  // utilitaire pour faire correspondre les index d'onglet aux id de source
  const {indexedSources, idToIndex, indexToId, getSourceType} =
    useIndexedSources(sources);

  // source sélectionnée
  const s = sources.find(s => s.id === currentSource);
  const sourceType = getSourceType(currentSource);
  const source =
    (s &&
      sourceType && {
        id: s.id,
        type: sourceType,
        nom: s.libelle,
      }) ||
    undefined;

  // libellé en fonction du type de source
  const sourceTypeLabel = getSourceTypeLabel(sourceType);

  // compare les données open-data avec les données courantes (si la source est externe)
  const comparaison = useOpenDataComparaison({
    definition,
    importSource: currentSource,
    type: sourceType,
  });

  // collectivité courante
  const collectivite = useCurrentCollectivite();
  const collectivite_id = collectivite?.collectivite_id || null;

  // détermine si le bouton "appliquer à mes objectifs/résultats" doit être affiché
  const canApplyOpenData =
    collectivite &&
    !collectivite.readonly &&
    currentSource !== SOURCE_COLLECTIVITE &&
    sourceTypeLabel &&
    !!(comparaison?.conflits || comparaison?.ajouts);

  // mutation pour appliquer les données
  const {mutate: applyOpenData} = useApplyOpenData({
    collectivite_id,
    definition,
    source,
  });

  // état local de la modale de résolution des conflits
  const [isOpen, setIsOpen] = useState(false);
  const [overwrite, setOverwrite] = useState(false);

  const trackEvent = useEventTracker('app/indicateurs/predefini');

  return indexedSources && setCurrentSource ? (
    /** onglets de sélection de la source si il y a des sources open-data dispo */
    <>
      <Tabs
        tabsListClassName="!justify-start"
        defaultActiveTab={idToIndex(currentSource)}
        onChange={activeTab => {
          const sourceId = indexToId(activeTab);
          setCurrentSource(sourceId);
          if (sourceId !== SOURCE_COLLECTIVITE)
            trackEvent('view_open_data', {
              collectivite_id: collectivite_id!,
              indicateur_id: definition.id as string,
              source_id: sourceId,
              type: sourceType || 'resultat',
            });
        }}
      >
        {indexedSources?.map(({id, libelle}) => (
          <Tab
            key={id}
            label={
              getSourceType(currentSource) === 'objectif'
                ? `Objectifs ${libelle}`
                : libelle
            }
          />
        ))}
      </Tabs>
      {canApplyOpenData && (
        /** bandeau & bouton "appliquer à mes objectifs/résultats" */
        <>
          <Alert
            classname="mb-8"
            state="info"
            title={`Vous pouvez appliquer ces données à vos ${sourceTypeLabel} : les données seront alors disponibles dans le tableau “Mes données” et seront éditables`}
            footer={
              <Button
                size="sm"
                onClick={() => {
                  // ouvrir le dialogue de résolution des conflits si nécessaire
                  if (comparaison?.conflits) {
                    if (!source || !sourceType) return;
                    setIsOpen(true);
                  } else {
                    // applique les changements si nécessaire
                    applyOpenData({comparaison, overwrite: false});
                  }
                }}
              >
                Appliquer à mes {sourceTypeLabel}
              </Button>
            }
          />
          {canApplyOpenData && isOpen && source && sourceType && (
            /** modale de résolution des conflits */
            <Modal
              size="xl"
              openState={{isOpen, setIsOpen}}
              title={`Appliquer les ${sourceTypeLabel} ${source.nom}`}
              render={() => (
                <>
                  <TrackPageView
                    pageName="app/indicateurs/predefini/conflits"
                    properties={{
                      collectivite_id: collectivite_id!,
                      indicateur_id: definition.id as string,
                    }}
                  />
                  <ApplyOpenDataModal
                    comparaison={comparaison}
                    definition={definition}
                    source={source}
                    overwrite={overwrite}
                    setOverwrite={setOverwrite}
                  />
                </>
              )}
              renderFooter={({close}) => (
                <ModalFooterOKCancel
                  btnCancelProps={{onClick: close}}
                  btnOKProps={{
                    onClick: () => {
                      // applique les changements si nécessaire
                      applyOpenData({comparaison, overwrite});
                      close();
                    },
                  }}
                />
              )}
            />
          )}
        </>
      )}
    </>
  ) : null;
};

/*
 * Ajoute la source "mes données" à l'index 0 et renvoi des fonctions
 * utilitaires pour transformer les id en index et réciproquement.
 */
const useIndexedSources = (sources?: IndicateurImportSource[] | null) => {
  // ajoute la source "mes données"
  const indexedSources = sources?.length
    ? [{id: SOURCE_COLLECTIVITE, libelle: 'Mes données'}, ...sources]
    : null;

  // converti un id de source en index
  const idToIndex = (id: string) => {
    if (id === SOURCE_COLLECTIVITE) {
      return 0;
    }
    const index = indexedSources?.findIndex(s => s.id === id);
    return index === -1 || index === undefined ? 0 : index;
  };

  // converti un index en id de source
  const indexToId = (index: number) =>
    index === 0
      ? SOURCE_COLLECTIVITE
      : indexedSources?.[index]?.id ?? SOURCE_COLLECTIVITE;

  // donne le type d'une source
  const getSourceType = (id: string) => {
    if (id === SOURCE_COLLECTIVITE) {
      return null;
    }
    const index = idToIndex(id);
    return indexedSources?.[index]?.type || 'resultat';
  };

  return {indexedSources, idToIndex, indexToId, getSourceType};
};