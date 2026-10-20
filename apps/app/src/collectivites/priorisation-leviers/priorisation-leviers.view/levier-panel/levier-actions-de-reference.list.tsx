import { appLabels } from '@/app/labels/catalog';
import { useListActionsDeReference } from '@/app/shared/actions-de-reference/data/use-list-actions-de-reference';
import { LoadingStatus } from '@/app/ui/shared/loading-status';
import { ErrorCard } from '@/app/utils/error/error.card';
import {
  type ActionDeReference,
  type CategorieAction,
  categorieActionEnumValues,
  type LevierId,
} from '@tet/domain/shared';
import {
  Accordion,
  type OptionValue,
  SelectMultiple,
  VisibleWhen,
} from '@tet/ui';
import { partition } from 'es-toolkit';
import { JSX, ReactNode, RefCallback, useState } from 'react';
import { match } from 'ts-pattern';
import { LevierCardInfo } from '../../levier-card-info';
import { FilterField, toCategorieOption } from '../../preselection.filters';
import { Preselection } from '../../use-preselection';
import { ActionDeReferencePreselectionCard } from './action-de-reference-preselection.card';
import { keepCategories } from './keep-categories';

type LevierActionsDeReferenceListProps = {
  actionsRef?: RefCallback<HTMLDivElement>;
  levierId: LevierId;
  initialCategorie?: CategorieAction;
  preselection: Preselection;
};

type ActionCardsProps = {
  actions: readonly ActionDeReference[];
  preselection: Preselection;
  actionsRef?: RefCallback<HTMLDivElement>;
};

type CategorieGroupProps = ActionCardsProps & {
  categorie: CategorieAction;
};

const ActionCards = ({
  actions,
  preselection,
  actionsRef,
}: ActionCardsProps): JSX.Element => (
  <ul role="list" className="m-0 flex list-none flex-col gap-3 p-0">
    {actions.map((action, index) => (
      <li key={action.id} className="p-0">
        <ActionDeReferencePreselectionCard
          action={action}
          status={preselection.statusOf(action.id)}
          preselection={preselection}
          actionsRef={index === 0 ? actionsRef : undefined}
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
  actionsRef,
}: CategorieGroupProps): JSX.Element => (
  <section className="flex flex-col gap-3">
    <CategorieTitle>{appLabels.categorieActionLabel(categorie)}</CategorieTitle>
    <ActionCards
      actions={actions}
      preselection={preselection}
      actionsRef={actionsRef}
    />
  </section>
);

const IgnoredActionsAccordion = ({
  actions,
  preselection,
}: Omit<ActionCardsProps, 'actionsRef'>): JSX.Element => (
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
  actionsRef,
}: ActionCardsProps): JSX.Element => {
  const [ignored, visible] = partition(
    actions,
    (action) => preselection.statusOf(action.id) === 'ignoree'
  );
  const actionsOfCategorie = (
    categorie: CategorieAction
  ): ActionDeReference[] =>
    visible.filter((action) => action.categories.includes(categorie));
  const categoriesWithActions = categorieActionEnumValues.filter(
    (categorie) => actionsOfCategorie(categorie).length > 0
  );
  const hasIgnoredActions = ignored.length > 0;
  const hasVisibleActions = categoriesWithActions.length > 0;

  return (
    <div
      ref={hasVisibleActions ? undefined : actionsRef}
      className="flex flex-col gap-6"
    >
      {categoriesWithActions.map((categorie, index) => (
        <CategorieGroup
          key={categorie}
          categorie={categorie}
          actions={actionsOfCategorie(categorie)}
          preselection={preselection}
          actionsRef={index === 0 ? actionsRef : undefined}
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

const toCategories = (
  values: readonly OptionValue[] | undefined
): CategorieAction[] =>
  categorieActionEnumValues.filter((categorie) => values?.includes(categorie));

export const LevierActionsDeReferenceList = ({
  actionsRef,
  levierId,
  initialCategorie,
  preselection,
}: LevierActionsDeReferenceListProps): JSX.Element => {
  const [categories, setCategories] = useState<CategorieAction[]>(
    initialCategorie === undefined ? [] : [initialCategorie]
  );
  const levierActions = useListActionsDeReference({
    searchedText: '',
    leviers: [levierId],
    categories: [],
    sortBy: 'categories',
  });
  const actionsQuery = keepCategories({ list: levierActions, categories });
  const isFiltering = categories.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <FilterField label={appLabels.filtrerParCategorie}>
        <SelectMultiple
          options={CATEGORIE_OPTIONS}
          values={categories}
          onChange={({ values }) => setCategories(toCategories(values))}
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
              ? appLabels.aucuneActionDeReferenceDansCategories
              : appLabels.aucuneActionDeReferenceDuLevier}
          </LevierCardInfo>
        ))
        .with({ status: 'loaded' }, ({ actions }) => (
          <>
            <VisibleWhen condition={isFiltering}>
              <FoundActionsCount count={actions.length} />
            </VisibleWhen>
            <GroupedActions
              actions={actions}
              preselection={preselection}
              actionsRef={actionsRef}
            />
          </>
        ))
        .exhaustive()}
    </div>
  );
};
