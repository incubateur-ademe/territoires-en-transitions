import type { DemarchePcaet } from '@/app/demarches/types';
import { appLabels } from '@/app/labels/catalog';
import { Badge, InlineEditWrapper, Select } from '@tet/ui';
import { JSX } from 'react';

const scotAecOptions = [
  { label: 'SCoT-AEC', value: 'oui' },
  { label: 'PCAET seul', value: 'non' },
];

/**
 * La qualification du document, corrigeable tant que l'amont est modifiable.
 *
 * La question est posée à l'étape 0 avec une coche pré-remplie sur oui : une
 * collectivité qui a validé sans la lire doit pouvoir se reprendre, et c'est un
 * marqueur que les services de l'État lisent sur le dossier.
 */
export const ScotAecField = ({
  isScotAec,
  readOnly,
  onChange,
}: {
  isScotAec: DemarchePcaet['isScotAec'];
  readOnly: boolean;
  onChange: (isScotAec: boolean) => void;
}): JSX.Element => (
  <InlineEditWrapper
    disabled={readOnly}
    renderOnEdit={({ openState }) => (
      <div className="min-w-[200px]">
        <Select
          openState={openState}
          options={scotAecOptions}
          values={isScotAec ? 'oui' : 'non'}
          onChange={(value) => {
            if (value) onChange(value === 'oui');
          }}
          inlineEdit
        />
      </div>
    )}
  >
    {(props) => (
      <button type="button" {...props}>
        <Badge
          title={
            isScotAec
              ? appLabels.demarcheScotAecBadge
              : appLabels.demarcheScotAecBadgeAbsent
          }
          variant={isScotAec ? 'info' : 'standard'}
          size="xs"
          uppercase={false}
        />
      </button>
    )}
  </InlineEditWrapper>
);
