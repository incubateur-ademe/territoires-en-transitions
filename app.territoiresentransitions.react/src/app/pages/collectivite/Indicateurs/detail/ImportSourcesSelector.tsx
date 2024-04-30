import {IndicateurImportSource, SOURCE_COLLECTIVITE} from './useImportSources';
import {Tab, Tabs} from '@tet/ui';

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
  const {indexedSources, idToIndex, indexToId} = useIndexedSources(sources);

  return indexedSources && setCurrentSource ? (
    <Tabs
      tabsListClassName="!justify-start"
      defaultActiveTab={idToIndex(currentSource)}
      onChange={activeTab => setCurrentSource(indexToId(activeTab))}
    >
      {indexedSources?.map(({id, libelle}) => (
        <Tab key={id} label={libelle} />
      ))}
    </Tabs>
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

  return {indexedSources, idToIndex, indexToId};
};
