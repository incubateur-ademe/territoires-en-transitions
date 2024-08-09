'use client';

import RadioAsButton from '@tet/site/components/dstet/buttons/RadioAsButton';
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
    <div className="flex flex-col gap-4 w-[280px]">
      <RadioAsButton
        id="engagees"
        label="Toutes les collectivités"
        name="filtre"
        checked={selectedFilter === 'engagees'}
        onCheck={() => onChangeFilter('engagees')}
      />
      <RadioAsButton
        id="labellisees_cae"
        label="Labellisées Climat Air Energie"
        name="filtre"
        checked={selectedFilter === 'labellisees_cae'}
        onCheck={() => onChangeFilter('labellisees_cae')}
      />
      <RadioAsButton
        id="labellisees_eci"
        label="Labellisées Économie Circulaire"
        name="filtre"
        checked={selectedFilter === 'labellisees_eci'}
        onCheck={() => onChangeFilter('labellisees_eci')}
      />
      <RadioAsButton
        id="cot"
        label="Collectivités non labellisées"
        name="filtre"
        checked={selectedFilter === 'cot'}
        onCheck={() => onChangeFilter('cot')}
      />
    </div>
  );
};

export default FiltreLabels;
