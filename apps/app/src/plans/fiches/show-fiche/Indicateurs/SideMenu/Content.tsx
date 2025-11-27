import { useUser } from '@/api/users/user-context/user-provider';
import { INDICATEUR_LABELS } from '@/app/app/pages/collectivite/Indicateurs/constants';
import {
  getFiltersForIndicateurClefs,
  getFiltersForMyIndicateurs,
  IndicateurDefinitionListItem,
  ListDefinitionsInputFilters,
  useListIndicateurDefinitions,
} from '@/app/indicateurs/definitions/use-list-indicateur-definitions';
import ThematiquesDropdown from '@/app/ui/dropdownLists/ThematiquesDropdown/ThematiquesDropdown';
import { Checkbox, Field, Icon, Input, Tooltip } from '@/ui';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import SelectIndicateursGrid from './SelectIndicateursGrid';

type Props = {
  selectedIndicateurs: IndicateurDefinitionListItem[] | null | undefined;
  onSelect: (indicateur: IndicateurDefinitionListItem) => void;
};

export const Content = ({ selectedIndicateurs, onSelect }: Props) => {
  const user = useUser();
  const { setValue, watch } = useForm<
    ListDefinitionsInputFilters & {
      searchText: string;
      searchTextDebounced: string;
    }
  >();

  const { searchText, searchTextDebounced, ...filters } = watch();

  const { data: { data: definitions } = {}, isPending: isDefinitionsLoading } =
    useListIndicateurDefinitions({
      filters: { ...filters, text: searchTextDebounced },
    });

  const [selectedIndicateursState, setSelectedIndicateursState] =
    useState(selectedIndicateurs);

  useEffect(() => {
    setSelectedIndicateursState(selectedIndicateurs);
  }, [selectedIndicateurs]);

  return (
    <div className="p-4">
      <div className="relative flex flex-col gap-4">
        <Field title="Rechercher par nom ou description" small>
          <Input
            type="search"
            onSearch={(v) => setValue('searchTextDebounced', v)}
            onChange={(e) => setValue('searchText', e.target.value)}
            value={searchText}
            placeholder="Rechercher"
            displaySize="sm"
          />
        </Field>
        <Field title="Thématique" small>
          <ThematiquesDropdown
            values={filters.thematiqueIds}
            onChange={(thematiques) =>
              setValue(
                'thematiqueIds',
                thematiques.length > 0 ? thematiques : undefined
              )
            }
            small
            dropdownZindex={900}
          />
        </Field>
        <Checkbox
          label={INDICATEUR_LABELS.keys.plural}
          checked={filters.categorieNoms?.includes('clef') ?? false}
          onChange={(event) =>
            setValue(
              'categorieNoms',
              event.target.checked
                ? getFiltersForIndicateurClefs().categorieNoms
                : undefined
            )
          }
        />
        <Checkbox
          label={INDICATEUR_LABELS.personalized.plural}
          checked={filters.estPerso}
          onChange={(event) =>
            setValue('estPerso', event.target.checked ? true : undefined)
          }
        />
        <Tooltip label={INDICATEUR_LABELS.favorites.tooltip}>
          <div className="flex items-center w-fit">
            <Checkbox
              label={INDICATEUR_LABELS.favorites.plural}
              checked={filters.estFavori}
              onChange={(event) =>
                setValue('estFavori', event.target.checked ? true : undefined)
              }
            />
            <Icon icon="information-line" size="sm" className="ml-1" />
          </div>
        </Tooltip>
        <Tooltip label={INDICATEUR_LABELS.myIndicateurs.tooltip}>
          <div className="flex items-center w-fit">
            <Checkbox
              label={INDICATEUR_LABELS.myIndicateurs.plural}
              checked={!!filters.utilisateurPiloteIds?.includes(user.id)}
              onChange={(event) =>
                setValue(
                  'utilisateurPiloteIds',
                  event.target.checked
                    ? getFiltersForMyIndicateurs(user.id).utilisateurPiloteIds
                    : undefined
                )
              }
            />
            <Icon icon="information-line" size="sm" className="ml-1" />
          </div>
        </Tooltip>
      </div>
      <hr className="p-0 my-6 w-full h-px" />
      <div className="mb-4 font-bold">
        {selectedIndicateursState ? (
          <>
            {selectedIndicateursState.length} indicateur
            {selectedIndicateursState.length > 1 && 's'} sélectionné
            {selectedIndicateursState.length > 1 && 's'}
          </>
        ) : (
          <>0 indicateur sélectionné</>
        )}
      </div>
      <SelectIndicateursGrid
        definitions={definitions}
        isLoading={isDefinitionsLoading}
        selectedIndicateurs={selectedIndicateursState}
        onSelect={onSelect}
      />
    </div>
  );
};
