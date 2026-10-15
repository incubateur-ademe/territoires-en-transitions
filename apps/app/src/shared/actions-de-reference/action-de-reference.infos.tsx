import { appLabels } from '@/app/labels/catalog';
import {
  type ActionDeReference,
  LEVIER_NOM_BY_ID,
  LEVIER_SECTEURS,
} from '@tet/domain/shared';
import { uniq } from 'es-toolkit';
import type { JSX } from 'react';
import { ActionDeReferenceInfoItem } from './action-de-reference-info.item';
import { ActionDeReferenceImpactInfo } from './action-de-reference.impact';

const InfoLines = ({
  values,
}: {
  readonly values: readonly string[];
}): JSX.Element => (
  <>
    {values.map((value) => (
      <span key={value} className="block">
        {value}
      </span>
    ))}
  </>
);

const ActionDeReferenceInfos = ({
  action,
}: {
  readonly action: ActionDeReference;
}): JSX.Element => {
  const levierNoms = action.leviers.map((levier) => LEVIER_NOM_BY_ID[levier]);
  const secteurs = uniq(levierNoms.map((nom) => LEVIER_SECTEURS[nom]));
  const categories = action.categories.map((categorie) =>
    appLabels.categorieActionLabel(categorie)
  );

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6">
      <ActionDeReferenceInfoItem
        icon="building-line"
        label={appLabels.actionDeReferenceSecteurInfo}
      >
        <InfoLines values={secteurs} />
      </ActionDeReferenceInfoItem>
      <ActionDeReferenceInfoItem
        icon="folder-add-line"
        label={appLabels.actionDeReferenceLevierInfo}
      >
        <InfoLines values={levierNoms} />
      </ActionDeReferenceInfoItem>
      <ActionDeReferenceInfoItem
        icon="bookmark-line"
        label={appLabels.actionDeReferenceCategorieInfo}
      >
        <InfoLines values={categories} />
      </ActionDeReferenceInfoItem>
      <ActionDeReferenceImpactInfo action={action} />
    </div>
  );
};

export { ActionDeReferenceInfos };
