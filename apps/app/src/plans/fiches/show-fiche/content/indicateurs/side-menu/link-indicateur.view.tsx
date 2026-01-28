import { INDICATEUR_LABELS } from '@/app/app/pages/collectivite/Indicateurs/constants';
import {
  getFiltersForIndicateurClefs,
  getFiltersForMyIndicateurs,
  ListDefinitionsInputFilters,
  useListIndicateurs,
} from '@/app/indicateurs/indicateurs/use-list-indicateurs';
import {
  FicheContextValue,
  useFicheContext,
} from '@/app/plans/fiches/show-fiche/context/fiche-context';
import ThematiquesDropdown from '@/app/ui/dropdownLists/ThematiquesDropdown/ThematiquesDropdown';
import { useUser } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Checkbox, Divider, Field, Icon, Input, Tooltip } from '@tet/ui';
import { useForm } from 'react-hook-form';
import { IndicateursSelectorGrid } from './indicateurs-selector.grid';

export const LinkIndicateursView = () => {
  const { indicateurs } = useFicheContext();
  return <LinkIndicateursViewBase indicateurs={indicateurs} />;
};

export const LinkIndicateursViewBase = ({
  indicateurs,
}: {
  indicateurs: Pick<FicheContextValue['indicateurs'], 'list' | 'update'>;
}) => {
  const selectedIndicateurs = indicateurs.list;
  const onSelect = indicateurs.update;
  const user = useUser();
  const collectiviteId = useCollectiviteId();

  const { setValue, watch } = useForm<
    ListDefinitionsInputFilters & {
      searchText: string;
      searchTextDebounced: string;
    }
  >();

  const { searchText, searchTextDebounced, ...filters } = watch();

  const { data: { data: definitions } = {}, isPending: isDefinitionsLoading } =
    useListIndicateurs({
      collectiviteId,
      filters: { ...filters, text: searchTextDebounced },
    });

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
      <Divider color="primary" className="my-6" />
      <div className="mb-4 font-bold">
        {selectedIndicateurs ? (
          <>
            {selectedIndicateurs.length} indicateur
            {selectedIndicateurs.length > 1 && 's'} sélectionné
            {selectedIndicateurs.length > 1 && 's'}
          </>
        ) : (
          <>0 indicateur sélectionné</>
        )}
      </div>
      <IndicateursSelectorGrid
        definitions={definitions}
        isLoading={isDefinitionsLoading}
        selectedIndicateurs={selectedIndicateurs}
        onSelect={onSelect}
      />
    </div>
  );
};
