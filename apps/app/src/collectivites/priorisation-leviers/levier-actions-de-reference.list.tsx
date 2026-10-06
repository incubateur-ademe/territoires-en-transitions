import { appLabels } from '@/app/labels/catalog';
import type { ActionsDeReferenceList } from '@/app/shared/actions-de-reference/actions-de-reference.contract';
import { useListActionsDeReference } from '@/app/shared/actions-de-reference/data/use-list-actions-de-reference';
import { SearchBar } from '@/app/shared/actions-de-reference/search-bar';
import { LoadingStatus } from '@/app/ui/shared/loading-status';
import { ErrorCard } from '@/app/utils/error/error.card';
import {
  type ActionDeReference,
  type CategorieAction,
  categorieActionEnumValues,
  type LevierId,
} from '@tet/domain/shared';
import { Accordion, Select, VisibleWhen } from '@tet/ui';
import { groupBy, partition } from 'es-toolkit';
import { JSX, ReactNode, useState } from 'react';
import { match } from 'ts-pattern';
import { ActionDeReferencePreselectionCard } from './action-de-reference-preselection.card';
import { LevierCardInfo } from './levier-card-info';
import {
  FilterField,
  toCategorie,
  toCategorieOption,
} from './preselection.filters';
import { Preselection } from './use-preselection';

type LevierActionsDeReferenceListProps = {
  levierId: LevierId;
  initialCategorie?: CategorieAction;
  preselection: Preselection;
};

type ActionCardsProps = {
  actions: readonly ActionDeReference[];
  preselection: Preselection;
};

type CategorieGroupProps = ActionCardsProps & {
  categorie: CategorieAction;
};

const ActionCards = ({
  actions,
  preselection,
}: ActionCardsProps): JSX.Element => (
  <ul role="list" className="m-0 flex list-none flex-col gap-3 p-0">
    {actions.map((action) => (
      <li key={action.id} className="p-0">
        <ActionDeReferencePreselectionCard
          action={action}
          status={preselection.statusOf(action.id)}
          preselection={preselection}
        />
      </li>
    ))}
  </ul>
);

const CategorieTitle = ({ children }: { children: ReactNode }): JSX.Element => (
  <h3 className="mb-0 text-sm text-primary-9">{children}</h3>
);

const CategorieGroup = ({
  categorie,
  actions,
  preselection,
}: CategorieGroupProps): JSX.Element => (
  <section className="flex flex-col gap-3">
    <CategorieTitle>{appLabels.categorieActionLabel(categorie)}</CategorieTitle>
    <ActionCards actions={actions} preselection={preselection} />
  </section>
);

const IgnoredActionsAccordion = ({
  actions,
  preselection,
}: ActionCardsProps): JSX.Element => (
  <Accordion
    title={appLabels.actionsIgnorees({ count: actions.length })}
    containerClassname="border-y-0"
    headerClassname="py-2 text-sm"
    content={<ActionCards actions={actions} preselection={preselection} />}
  />
);

const FoundActionsCount = ({ count }: { count: number }): JSX.Element => (
  <p role="status" className="mb-0 text-sm font-normal text-grey-8">
    {appLabels.actionsDeReferenceTrouvees({ count })}
  </p>
);

const GroupedActions = ({
  actions,
  preselection,
}: ActionCardsProps): JSX.Element => {
  const [ignored, visible] = partition(
    actions,
    (action) => preselection.statusOf(action.id) === 'ignoree'
  );
  const byCategorie = groupBy(visible, (action) => action.categorie);
  const categoriesWithActions = categorieActionEnumValues.filter(
    (categorie) => (byCategorie[categorie] ?? []).length > 0
  );
  const hasIgnoredActions = ignored.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {categoriesWithActions.map((categorie) => (
        <CategorieGroup
          key={categorie}
          categorie={categorie}
          actions={byCategorie[categorie]}
          preselection={preselection}
        />
      ))}
      <VisibleWhen condition={hasIgnoredActions}>
        <IgnoredActionsAccordion
          actions={ignored}
          preselection={preselection}
        />
      </VisibleWhen>
    </div>
  );
};

const CATEGORIE_OPTIONS = categorieActionEnumValues.map(toCategorieOption);

const keepCategorie = ({
  list,
  categorie,
}: {
  list: ActionsDeReferenceList;
  categorie: CategorieAction | undefined;
}): ActionsDeReferenceList => {
  const hasActionsToFilter =
    list.status === 'loaded' && categorie !== undefined;
  if (!hasActionsToFilter) {
    return list;
  }
  return {
    ...list,
    actions: list.actions.filter((action) => action.categorie === categorie),
  };
};

export const LevierActionsDeReferenceList = ({
  levierId,
  initialCategorie,
  preselection,
}: LevierActionsDeReferenceListProps): JSX.Element => {
  const [searchedText, setSearchedText] = useState('');
  const [categorie, setCategorie] = useState(initialCategorie);
  const levierActions = useListActionsDeReference({
    searchedText,
    leviers: [levierId],
    categories: [],
    sortBy: 'categorie',
  });
  const actionsQuery = keepCategorie({ list: levierActions, categorie });
  const isFiltering = searchedText !== '' || categorie !== undefined;

  return (
    <div className="flex flex-col gap-4">
      <SearchBar
        searchedText={searchedText}
        onSearch={setSearchedText}
        label={appLabels.rechercherUneActionDeReference}
      />
      <FilterField label={appLabels.filtrerParCategorie}>
        <Select
          options={CATEGORIE_OPTIONS}
          values={categorie}
          onChange={(value) => setCategorie(toCategorie(value))}
          placeholder={appLabels.filtrerParCategorie}
          small
        />
      </FilterField>
      {match(actionsQuery)
        .with({ status: 'loading' }, () => <LoadingStatus />)
        .with({ status: 'error' }, ({ retry }) => (
          <ErrorCard
            title={appLabels.uneErreurEstSurvenue}
            retry={retry}
            retryLabel={appLabels.reessayer}
          />
        ))
        .with({ status: 'loaded', actions: [] }, () => (
          <LevierCardInfo>
            {isFiltering
              ? appLabels.actionsDeReferenceAucune
              : appLabels.aucuneActionDeReferenceDuLevier}
          </LevierCardInfo>
        ))
        .with({ status: 'loaded' }, ({ actions }) => (
          <>
            <VisibleWhen condition={isFiltering}>
              <FoundActionsCount count={actions.length} />
            </VisibleWhen>
            <GroupedActions actions={actions} preselection={preselection} />
          </>
        ))
        .exhaustive()}
    </div>
  );
};
