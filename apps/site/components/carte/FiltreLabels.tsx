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
      {/** Toutes les collectivitées :
       * - engagées labellisées CAE ou ECI
       * - engagées non labellisées (= COT non labellisées)
       * - actives sur la plateforme, engagées ou non
       */}
      <RadioButton
        label="Toutes les collectivités"
        id="toutes"
        value="toutes"
        name="filtre"
        checked={selectedFilter === 'toutes'}
        onChange={() => onChangeFilter('toutes')}
      />

      {/* Labellisées CAE */}
      <RadioButton
        label="Labellisées Climat-Air-Énergie"
        id="labellisees_cae"
        value="labellisees_cae"
        name="filtre"
        checked={selectedFilter === 'labellisees_cae'}
        onChange={() => onChangeFilter('labellisees_cae')}
      />

      {/* Labellisées ECI */}
      <RadioButton
        label="Labellisées Économie Circulaire"
        id="labellisees_eci"
        value="labellisees_eci"
        name="filtre"
        checked={selectedFilter === 'labellisees_eci'}
        onChange={() => onChangeFilter('labellisees_eci')}
      />

      {/* Collectivités COT non labellisées */}
      <RadioButton
        label="Collectivités engagées non labellisées"
        id="cot_non_labellisees"
        value="cot_non_labellisees"
        name="filtre"
        checked={selectedFilter === 'cot_non_labellisees'}
        onChange={() => onChangeFilter('cot_non_labellisees')}
      />
    </div>
  );
};

export default FiltreLabels;
