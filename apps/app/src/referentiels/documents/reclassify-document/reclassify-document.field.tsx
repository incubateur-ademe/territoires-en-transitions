import { appLabels } from '@/app/labels/catalog';
import { ObjetPreuve, ObjetPreuveEnum } from '@tet/domain/referentiels';
import { RadioButton } from '@tet/ui';
import { ReactNode } from 'react';

const selectableObjets = [
  ObjetPreuveEnum.ACTE_ENGAGEMENT,
  ObjetPreuveEnum.CANDIDATURE,
  null,
] as const;

const objetLabels: Record<ObjetPreuve | 'null', string> = {
  [ObjetPreuveEnum.ACTE_ENGAGEMENT]: appLabels.reclasserDocumentActeEngagement,
  [ObjetPreuveEnum.CANDIDATURE]: appLabels.reclasserDocumentCandidature,
  null: appLabels.reclasserDocumentNonClasse,
};

const toLabelKey = (objet: ObjetPreuve | null): ObjetPreuve | 'null' =>
  objet ?? 'null';

export const ReclassifyDocumentField = ({
  value,
  onChange,
}: {
  value: ObjetPreuve | null;
  onChange: (objet: ObjetPreuve | null) => void;
}): ReactNode => (
  <fieldset className="flex flex-col gap-4 m-0 p-0 border-0">
    <legend className="mb-2 p-0 font-medium text-primary-9">
      {appLabels.reclasserDocumentLegende}
    </legend>
    {selectableObjets.map((objet) => (
      <RadioButton
        key={toLabelKey(objet)}
        name="objet-document"
        value={toLabelKey(objet)}
        checked={value === objet}
        onChange={() => onChange(objet)}
        label={objetLabels[toLabelKey(objet)]}
      />
    ))}
  </fieldset>
);
