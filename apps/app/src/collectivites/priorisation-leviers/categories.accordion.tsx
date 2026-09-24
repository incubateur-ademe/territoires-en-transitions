import { appLabels } from '@/app/labels/catalog';
import { Accordion, Badge, Icon } from '@tet/ui';
import { JSX } from 'react';
import { match } from 'ts-pattern';
import { UpsertPertinence } from './data/use-upsert-pertinence';
import { LevierCardInfo } from './levier-card-info';
import { PertinenceField } from './pertinence-field';
import { LevierCard, LevierCategorie } from './to-levier-cards';

type LevierCategoriesProps = {
  levier: Pick<LevierCard, 'levierId' | 'nom' | 'categories'>;
  upsertPertinence?: UpsertPertinence;
};

type CategoriePertinenceProps = LevierCategorie & {
  levier: Pick<LevierCard, 'levierId' | 'nom'>;
  upsertPertinence?: UpsertPertinence;
};

const ActionsRattacheesBadge = ({
  ficheCount,
}: {
  ficheCount: number;
}): JSX.Element => (
  <Badge
    variant="success"
    size="sm"
    uppercase={false}
    iconPosition="left"
    icon={(className) => (
      <Icon icon="check-line" size="xs" className={className} aria-hidden />
    )}
    title={appLabels.actionsRattachees({ count: ficheCount })}
  />
);

const CategoriePertinence = ({
  levier,
  categorie,
  ficheCount,
  pertinenceEffective,
  upsertPertinence,
}: CategoriePertinenceProps): JSX.Element =>
  match(pertinenceEffective)
    .with({ kind: 'mobilise' }, () => (
      <ActionsRattacheesBadge ficheCount={ficheCount} />
    ))
    .with({ kind: 'heritee_du_levier' }, () => (
      <LevierCardInfo>{appLabels.pertinenceHeriteeDuLevier}</LevierCardInfo>
    ))
    .with({ kind: 'propre' }, ({ pertinence }) => (
      <PertinenceField
        levier={levier}
        categorie={categorie}
        pertinence={pertinence}
        upsertPertinence={upsertPertinence}
      />
    ))
    .exhaustive();

const CategorieList = ({
  levier,
  upsertPertinence,
}: LevierCategoriesProps): JSX.Element => (
  <ul
    role="list"
    className="m-0 flex list-none flex-col gap-3 px-2 pb-4 pt-0 font-normal"
  >
    {levier.categories.map(({ categorie, ficheCount, pertinenceEffective }) => (
      <li key={categorie} className="flex flex-col items-start gap-1 p-0">
        <span className="text-sm text-primary-9">
          {appLabels.categorieActionLabel(categorie)}
        </span>
        <CategoriePertinence
          levier={levier}
          categorie={categorie}
          ficheCount={ficheCount}
          pertinenceEffective={pertinenceEffective}
          upsertPertinence={upsertPertinence}
        />
      </li>
    ))}
  </ul>
);

export const CategoriesAccordion = ({
  levier,
  upsertPertinence,
}: LevierCategoriesProps): JSX.Element => (
  <Accordion
    title={appLabels.categories}
    additionalRightHeaderContent={
      <span className="font-normal">{levier.categories.length}</span>
    }
    content={
      <CategorieList levier={levier} upsertPertinence={upsertPertinence} />
    }
    containerClassname="border-y-0"
    headerClassname="py-2 text-sm"
  />
);
