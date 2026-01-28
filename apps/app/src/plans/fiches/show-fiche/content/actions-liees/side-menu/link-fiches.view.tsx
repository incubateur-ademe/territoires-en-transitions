import { useListFiches } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import { useFicheContext } from '@/app/plans/fiches/show-fiche/context/fiche-context';
import PlansActionDropdown from '@/app/ui/dropdownLists/PlansActionDropdown';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Divider, Field, Input, Spacer } from '@tet/ui';
import { Controller, useForm } from 'react-hook-form';
import { FichesSelectorGrid } from './fiches-selector.grid';

type Filters = {
  searchText: string;
  searchTextDebounced: string;
  planActionIds?: number[];
};

export const LinkFichesView = () => {
  const { fiche, actionsLiees } = useFicheContext();
  const linkedFicheIds = actionsLiees.list.map((f) => f.id);
  const currentFicheId = fiche.id;
  const onSelect = actionsLiees.updateActionLiee;
  const collectiviteId = useCollectiviteId();

  const { register, watch, setValue, control } = useForm<Filters>({
    defaultValues: {
      searchText: '',
      searchTextDebounced: '',
      planActionIds: undefined,
    },
  });

  const { searchTextDebounced, planActionIds } = watch();

  const { fiches, count, isLoading } = useListFiches(collectiviteId, {
    filters: {
      texteNomOuDescription: searchTextDebounced || undefined,
      planActionIds:
        planActionIds && planActionIds.length > 0 ? planActionIds : undefined,
    },
    queryOptions: {
      sort: [{ field: 'titre', direction: 'asc' }],
      limit: 20,
      page: 1,
    },
  });

  const filteredFiches = fiches.filter((fiche) => fiche.id !== currentFicheId);

  return (
    <div className="p-4">
      <div className="relative flex flex-col gap-4">
        <Field title="Rechercher par intitulé" small>
          <Input
            type="search"
            {...register('searchText')}
            onSearch={(v) => setValue('searchTextDebounced', v)}
            placeholder="Rechercher"
            displaySize="sm"
          />
        </Field>
        <Field title="Plan d'action" small>
          <Controller
            name="planActionIds"
            control={control}
            render={({ field: { value, onChange } }) => (
              <PlansActionDropdown
                type="multiple"
                values={value}
                onChange={({ plans }) =>
                  onChange(plans && plans.length > 0 ? plans : undefined)
                }
              />
            )}
          />
        </Field>
      </div>
      <Divider color="primary" className="my-6" />
      <div className="mb-4 text-sm">
        {isLoading ? (
          <span className="text-grey-6">Chargement...</span>
        ) : (
          <>
            <SearchResultsSummary
              count={count}
              linkedFicheIds={linkedFicheIds}
            />
            <Spacer height={0.5} />
            <FichesSelectorGrid
              fiches={filteredFiches}
              selectedFiches={linkedFicheIds}
              onSelect={onSelect}
            />
          </>
        )}
      </div>
    </div>
  );
};

const SearchResultsSummary = ({
  count,
  linkedFicheIds,
}: {
  count: number;
  linkedFicheIds: number[];
}) => {
  const resultSuffix = count > 1 ? 's' : '';
  const linkedFicheSuffix = linkedFicheIds.length > 1 ? 's' : '';
  return (
    <>
      <span className="font-bold">
        {count} résultat{resultSuffix}
      </span>
      {linkedFicheIds.length > 0 && (
        <>
          {' • '}
          <span className="text-grey-7">
            {linkedFicheIds.length} action
            {linkedFicheSuffix} sélectionnée
            {linkedFicheSuffix}
          </span>
        </>
      )}
    </>
  );
};
