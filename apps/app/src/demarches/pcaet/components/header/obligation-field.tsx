import type { DemarchePcaet } from '@/app/demarches/pcaet/demarche-pcaet.types';
import { appLabels } from '@/app/labels/catalog';
import { Badge, InlineEditWrapper, Select } from '@tet/ui';
import { JSX } from 'react';

const obligationOptions = [
  { label: 'Obligatoire', value: 'obligatoire' },
  { label: 'Volontaire', value: 'volontaire' },
];

const ObligationBadge = ({
  obligation,
}: {
  obligation: DemarchePcaet['obligation'];
}) => (
  <Badge
    title={
      obligation === 'obligatoire'
        ? appLabels.demarchePcaetObligationObligatoire
        : appLabels.demarchePcaetObligationVolontaire
    }
    variant={obligation === 'obligatoire' ? 'error' : 'standard'}
    size="xs"
  />
);

export const ObligationField = ({
  obligation,
  readOnly,
  onChange,
}: {
  obligation: DemarchePcaet['obligation'];
  readOnly: boolean;
  onChange: (obligation: DemarchePcaet['obligation']) => void;
}): JSX.Element => (
  <InlineEditWrapper
    disabled={readOnly}
    renderOnEdit={({ openState }) => (
      <div className="min-w-[200px]">
        <Select
          openState={openState}
          options={obligationOptions}
          values={obligation}
          onChange={(value) => {
            if (value) onChange(value as DemarchePcaet['obligation']);
          }}
          custom={{
            renderOptionItem: (item) => (
              <ObligationBadge
                obligation={item.value as DemarchePcaet['obligation']}
              />
            ),
          }}
          inlineEdit
        />
      </div>
    )}
  >
    {(props) => (
      <button type="button" {...props}>
        <ObligationBadge obligation={obligation} />
      </button>
    )}
  </InlineEditWrapper>
);
