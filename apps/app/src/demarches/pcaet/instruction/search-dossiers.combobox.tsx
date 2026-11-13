'use client';

import { appLabels } from '@/app/labels/catalog';
import { SearchCombobox, type SearchComboboxSelection } from '@tet/ui';
import { useMemo } from 'react';
import {
  buildSearchDossiersSuggestions,
  SEARCH_GROUP,
  type CollectivitesSuivies,
} from './search-dossiers.suggestions';

type SearchFilters = {
  collectivites: number[];
  departements: string[];
  regions: string[];
};

type SearchGroup = (typeof SEARCH_GROUP)[keyof typeof SEARCH_GROUP];

const isSearchGroup = (id: string): id is SearchGroup =>
  Object.values<string>(SEARCH_GROUP).includes(id);

/**
 * La recherche de la liste d'instruction : un nom, même partiel ou mal tapé,
 * de collectivité ou de structure porteuse, avec des suggestions.
 *
 * Choisir une collectivité la pose en étiquette ; choisir un département ou une
 * région coche le filtre de sa colonne, qui reste le seul à les porter. Une
 * suggestion déjà choisie est cochée, et la choisir de nouveau la retire.
 *
 * @param collectivitesSuivies Chargées par la page, en même temps que la liste :
 * `undefined` tant qu'elles arrivent, le champ cherchant alors sans suggérer.
 */
export const SearchDossiersCombobox = ({
  collectivitesSuivies,
  recherche,
  filtres,
  onSearch,
  onFiltresChange,
}: {
  collectivitesSuivies: CollectivitesSuivies | undefined;
  recherche: string;
  filtres: SearchFilters;
  onSearch: (recherche: string) => void;
  onFiltresChange: (filtres: Partial<SearchFilters>) => void;
}) => {
  const getSuggestions = useMemo(
    () =>
      collectivitesSuivies
        ? buildSearchDossiersSuggestions(collectivitesSuivies)
        : undefined,
    [collectivitesSuivies]
  );

  // Les valeurs choisies de chaque groupe, sous l'identifiant de leurs options.
  const selectedValues: Record<SearchGroup, string[]> = {
    collectivites: filtres.collectivites.map(String),
    departements: filtres.departements,
    regions: filtres.regions,
  };
  const applySelection = (group: SearchGroup, values: string[]) =>
    onFiltresChange(
      group === SEARCH_GROUP.collectivites
        ? { collectivites: values.map(Number) }
        : { [group]: values }
    );

  // Une collectivité choisie garde son étiquette, et donc de quoi la retirer,
  // même sans nom à montrer : territoire encore en chargement, ou lien partagé
  // depuis un autre service.
  const selections: SearchComboboxSelection[] = filtres.collectivites.map(
    (id) => ({
      id: String(id),
      label:
        collectivitesSuivies?.collectivites.find(
          (collectivite) => collectivite.id === id
        )?.nom ?? appLabels.instructionListeRechercheCollectiviteSansNom,
    })
  );

  return (
    <SearchCombobox
      label={appLabels.instructionListeRecherche}
      placeholder={appLabels.instructionListeRecherche}
      value={recherche}
      onSearch={onSearch}
      getSuggestions={getSuggestions}
      isOptionSelected={(option, group) =>
        isSearchGroup(group.id) && selectedValues[group.id].includes(option.id)
      }
      onSelectOption={(option, group) => {
        if (isSearchGroup(group.id)) {
          applySelection(group.id, [...selectedValues[group.id], option.id]);
        }
      }}
      onDeselectOption={(option, group) => {
        if (isSearchGroup(group.id)) {
          applySelection(
            group.id,
            selectedValues[group.id].filter((value) => value !== option.id)
          );
        }
      }}
      selections={selections}
      onRemoveSelection={(id) =>
        applySelection(
          SEARCH_GROUP.collectivites,
          selectedValues.collectivites.filter((value) => value !== id)
        )
      }
      fieldClassName="w-full sm:w-[28rem]"
      data-test="demarches.pcaet.instruction.recherche"
    />
  );
};
