import { appLabels } from '@/app/labels/catalog';
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
  isError?: boolean;
  searchParams: SearchParams;
  setSearchParams: (params: SearchParams) => void;
  status?: React.ReactNode;
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
    isError,
    countTotal,
    menuContainerClassname,
    searchParams,
    setSearchParams,
    status,
    renderSettings,
    settingsOpenState,
  } = props;
  const { displayGraphs, text, sortBy } = searchParams;

  // état local du champ de recherche
  const [search, setSearch] = useState<string>(text || '');
  const [previousFilterText, setPreviousFilterText] = useState(text);
  if (previousFilterText !== text) {
    setPreviousFilterText(text);
    setSearch(text ?? '');
  }

  const updateSearch = (value: string) => {
    // Ignore a delayed search invalidated by a reset or an external change.
    if (value !== search || value === (text ?? '')) return;
    const { text: previousText, ...params } = searchParams;
    setSearchParams({
      ...params,
      currentPage: 1,
      ...(value ? { text: value } : {}),
    });
  };

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
            custom={{
              renderOptionItem: (option) => (
                <span className="text-grey-8 text-sm">{option.label}</span>
              ),
            }}
            small
          />
        </div>

        <div className="flex flex-wrap gap-x-8 gap-y-4 max-md:order-first">
          {/** Toggle affichage des graph */}
          <Checkbox
            variant="switch"
            label={appLabels.afficherGraphiques}
            containerClassname="shrink-0"
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
            {isError
              ? appLabels.indicateurVueCountError
              : isLoading
              ? '--'
              : appLabels.indicateur({
                  count: countTotal,
                })}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-x-8 gap-y-4">
        {status}
        {/** Champ de recherche */}
        <Input
          type="search"
          onChange={(e) => setSearch(e.target.value)}
          onBlur={({ relatedTarget }) => {
            if (!relatedTarget) return;
            if (
              relatedTarget instanceof Element &&
              relatedTarget.closest('a[href]')
            ) {
              // A queued URL update must not override the destination of a link.
              setSearch(text ?? '');
              return;
            }
            updateSearch(search);
          }}
          onSearch={updateSearch}
          value={search}
          containerClassname="w-full xl:w-96"
          placeholder={appLabels.rechercherNomDescription}
          displaySize="sm"
          autoFocus
        />
        {/** Bouton d'édition des filtres (une modale avec bouton ou un ButtonMenu) */}
        {renderSettings?.(settingsOpenState)}
      </div>
    </div>
  );
};
