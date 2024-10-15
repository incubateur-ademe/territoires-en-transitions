'use client';

import { RadioButton } from '@tet/ui';
import { FiltresLabels } from './CarteCollectivites';

type FiltreLabelsProps = {
  selectedFilter: FiltresLabels;
  onChangeFilter: (filter: FiltresLabels) => void;
};

const FiltreLabels = ({
  selectedFilter,
  onChangeFilter,
}: FiltreLabelsProps) => {
  return (
    <div className="flex flex-col gap-4 w-fit">
      <RadioButton
        label="Toutes les collectivités"
        id="toutes"
        value="toutes"
        name="filtre"
        checked={selectedFilter === 'toutes'}
        onChange={() => onChangeFilter('toutes')}
      />

      <RadioButton
        label="Labellisées Climat-Air-Énergie"
        id="labellisees_cae"
        value="labellisees_cae"
        name="filtre"
        checked={selectedFilter === 'labellisees_cae'}
        onChange={() => onChangeFilter('labellisees_cae')}
      />

      <RadioButton
        label="Labellisées Économie Circulaire"
        id="labellisees_eci"
        value="labellisees_eci"
        name="filtre"
        checked={selectedFilter === 'labellisees_eci'}
        onChange={() => onChangeFilter('labellisees_eci')}
      />

      <RadioButton
        label="Collectivités engagées non labellisées"
        id="cot"
        value="cot"
        name="filtre"
        checked={selectedFilter === 'cot'}
        onChange={() => onChangeFilter('cot')}
      />
    </div>
  );
};

export default FiltreLabels;
