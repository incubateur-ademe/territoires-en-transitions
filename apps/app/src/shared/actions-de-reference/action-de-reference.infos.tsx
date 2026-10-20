import { appLabels } from '@/app/labels/catalog';
import { DetailedAction } from '@/app/ui/detailed-action/detailed-action.layout';
import {
  type ActionDeReference,
  LEVIER_NOM_BY_ID,
  LEVIER_SECTEURS,
} from '@tet/domain/shared';
import { uniq } from 'es-toolkit';
import type { JSX } from 'react';
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
    <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
      <DetailedAction.Item
        small
        icon="building-line"
        label={appLabels.actionDeReferenceSecteurInfo}
      >
        <InfoLines values={secteurs} />
      </DetailedAction.Item>
      <DetailedAction.Item
        small
        icon="folder-add-line"
        label={appLabels.actionDeReferenceLevierInfo}
      >
        <InfoLines values={levierNoms} />
      </DetailedAction.Item>
      <DetailedAction.Item
        small
        icon="bookmark-line"
        label={appLabels.actionDeReferenceCategorieInfo}
      >
        <InfoLines values={categories} />
      </DetailedAction.Item>
      <ActionDeReferenceImpactInfo action={action} />
    </div>
  );
};

export { ActionDeReferenceInfos };
