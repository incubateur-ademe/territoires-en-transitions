import {Alert, Button, Tab, Tabs} from '@tet/ui';
import {SOURCE_COLLECTIVITE, SourceType} from '../types';
import {IndicateurImportSource} from './useImportSources';

const SOURCE_TYPE_LABEL: Record<SourceType, string> = {
  objectif: 'objectifs',
  resultat: 'résultats',
};

const getSourceTypeLabel = (sourceType: SourceType | null) =>
  (sourceType && SOURCE_TYPE_LABEL[sourceType]) || null;

/**
 * Affiche le sélecteur des sources de données d'un indicateur, lorsqu'il
 * y en a plusieurs. Sinon rien n'est affiché.
 */
export const ImportSourcesSelector = ({
  sources,
  currentSource,
  setCurrentSource,
}: {
  sources?: IndicateurImportSource[] | null;
  currentSource: string;
  setCurrentSource?: (value: string) => void;
}) => {
  const {indexedSources, idToIndex, indexToId, getSourceType} =
    useIndexedSources(sources);
  const sourceTypeLabel = getSourceTypeLabel(getSourceType(currentSource));

  return indexedSources && setCurrentSource ? (
    <>
      <Tabs
        tabsListClassName="!justify-start"
        defaultActiveTab={idToIndex(currentSource)}
        onChange={activeTab => setCurrentSource(indexToId(activeTab))}
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
      {currentSource !== SOURCE_COLLECTIVITE && sourceTypeLabel && (
        <Alert
          classname="mb-8"
          state="info"
          title={`Vous pouvez appliquer ces données à vos ${sourceTypeLabel} : les données seront alors disponibles dans le tableau “Mes données” et seront éditables`}
          footer={<Button size="sm">Appliquer à mes {sourceTypeLabel}</Button>}
        />
      )}
    </>
  ) : null;
};

/**
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
