import { appLabels } from '@/app/labels/catalog';
import { Accordion, Badge, Icon } from '@tet/ui';
import { JSX } from 'react';
import { match } from 'ts-pattern';
import { LevierCardInfo } from './levier-card-info';
import { LevierCategorie } from './to-levier-cards';

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
  ficheCount,
  pertinenceEffective,
}: Pick<LevierCategorie, 'ficheCount' | 'pertinenceEffective'>): JSX.Element =>
  match(pertinenceEffective)
    .with({ kind: 'mobilise' }, () => (
      <ActionsRattacheesBadge ficheCount={ficheCount} />
    ))
    .with({ kind: 'heritee_du_levier' }, () => (
      <LevierCardInfo>{appLabels.pertinenceHeriteeDuLevier}</LevierCardInfo>
    ))
    .with({ kind: 'propre' }, ({ pertinence }) => (
      <LevierCardInfo>{appLabels.pertinenceInfo(pertinence)}</LevierCardInfo>
    ))
    .exhaustive();

const CategorieList = ({
  categories,
}: {
  categories: LevierCategorie[];
}): JSX.Element => (
  <ul
    role="list"
    className="m-0 flex list-none flex-col gap-3 px-2 pb-4 pt-0 font-normal"
  >
    {categories.map((categorie) => (
      <li
        key={categorie.categorie}
        className="flex flex-col items-start gap-1 p-0"
      >
        <span className="text-sm text-primary-9">
          {appLabels.categorieActionLabel(categorie.categorie)}
        </span>
        <CategoriePertinence
          ficheCount={categorie.ficheCount}
          pertinenceEffective={categorie.pertinenceEffective}
        />
      </li>
    ))}
  </ul>
);

export const CategoriesAccordion = ({
  categories,
}: {
  categories: LevierCategorie[];
}): JSX.Element => (
  <Accordion
    title={appLabels.categories}
    additionalRightHeaderContent={
      <span className="font-normal">{categories.length}</span>
    }
    content={<CategorieList categories={categories} />}
    containerClassname="border-y-0"
    headerClassname="py-2 text-sm"
  />
);
