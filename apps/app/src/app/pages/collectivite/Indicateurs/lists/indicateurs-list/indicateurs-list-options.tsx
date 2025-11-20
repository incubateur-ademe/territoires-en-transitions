import { Checkbox, Input, Select } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import classNames from 'classnames';
import { useState } from 'react';
import {
  SearchParams,
  SortBy,
  sortByItems,
} from './use-indicateurs-list-params';

export type IndicateursListeOptionsProps = {
  menuContainerClassname?: string;
  isLoading?: boolean;
  searchParams: SearchParams;
  setSearchParams: (params: SearchParams) => void;
  renderSettings?: (openState: OpenState) => React.ReactNode;
};

/** Affiche la barre d'options (tri, champ de recherche, etc.) d'une liste d'indicateurs */
export const IndicateursListeOptions = (
  props: IndicateursListeOptionsProps & {
    countTotal: number;
    settingsOpenState: OpenState;
  }
) => {
  const {
    isLoading,
    countTotal,
    menuContainerClassname,
    searchParams,
    setSearchParams,
    renderSettings,
    settingsOpenState,
  } = props;
  const { displayGraphs, text, sortBy } = searchParams;

  // état local du champ de recherche
  const [search, setSearch] = useState<string>(text || '');

  return (
    <div
      className={classNames(
        'flex max-xl:flex-col justify-between xl:items-center gap-4 pt-1 pb-6 border-b border-primary-3',
        menuContainerClassname
      )}
    >
      <div className="flex max-md:flex-col gap-x-8 gap-y-4 md:items-center">
        {/** Tri */}
        <div className="w-full md:w-64">
          <Select
            options={sortByItems}
            onChange={(value) =>
              value &&
              setSearchParams({ ...searchParams, sortBy: value as SortBy })
            }
            values={sortBy}
            customItem={(v) => <span className="text-grey-8">{v.label}</span>}
            small
          />
        </div>

        <div className="flex flex-wrap gap-x-8 gap-y-4 max-md:order-first">
          {/** Toggle affichage des graph */}
          <Checkbox
            variant="switch"
            label="Afficher les graphiques"
            containerClassname="shrink-0"
            labelClassname="font-normal !text-grey-7"
            checked={displayGraphs}
            onChange={() => {
              setSearchParams({
                ...searchParams,
                displayGraphs: !displayGraphs,
              });
            }}
          />

          {/** Nombre total de résultats */}
          <span className="shrink-0 text-grey-7">
            {isLoading ? '--' : countTotal}
            {` `}
            {`indicateur`}
            {countTotal > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="flex gap-x-8 gap-y-4">
        {/** Champ de recherche */}
        <Input
          type="search"
          onChange={(e) => setSearch(e.target.value)}
          onSearch={(v) =>
            setSearchParams({ ...searchParams, currentPage: 1, text: v })
          }
          value={search}
          containerClassname="w-full xl:w-96"
          placeholder="Rechercher par nom ou description"
          displaySize="sm"
        />
        {/** Bouton d'édition des filtres (une modale avec bouton ou un ButtonMenu) */}
        {renderSettings?.(settingsOpenState)}
      </div>
    </div>
  );
};
