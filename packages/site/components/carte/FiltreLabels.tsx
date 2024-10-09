'use client';

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
      <div className="flex flex-row gap-2">
        <input
          type="radio"
          id="toutes"
          value="toutes"
          name="filtre"
          checked={selectedFilter === 'toutes'}
          onChange={() => onChangeFilter('toutes')}
        />
        <label htmlFor="toutes" className="text-base text-grey-8 font-medium">
          Toutes les collectivités
        </label>
      </div>

      <div className="flex flex-row gap-2">
        <input
          type="radio"
          id="labellisees_cae"
          value="labellisees_cae"
          name="filtre"
          checked={selectedFilter === 'labellisees_cae'}
          onChange={() => onChangeFilter('labellisees_cae')}
        />
        <label
          htmlFor="labellisees_cae"
          className="text-base text-grey-8 font-medium"
        >
          Labellisées Climat-Air-Énergie
        </label>
      </div>

      <div className="flex flex-row gap-2">
        <input
          type="radio"
          id="labellisees_eci"
          value="labellisees_eci"
          name="filtre"
          checked={selectedFilter === 'labellisees_eci'}
          onChange={() => onChangeFilter('labellisees_eci')}
        />
        <label
          htmlFor="labellisees_eci"
          className="text-base text-grey-8 font-medium"
        >
          Labellisées Économie Circulaire
        </label>
      </div>

      <div className="flex flex-row gap-2">
        <input
          type="radio"
          id="cot"
          value="cot"
          name="filtre"
          checked={selectedFilter === 'cot'}
          onChange={() => onChangeFilter('cot')}
        />
        <label htmlFor="cot" className="text-base text-grey-8 font-medium">
          Collectivités engagées non labellisées
        </label>
      </div>

      <div className="flex flex-row gap-2">
        <input
          type="radio"
          id="actives"
          value="actives"
          name="filtre"
          checked={selectedFilter === 'actives'}
          onChange={() => onChangeFilter('actives')}
        />
        <label htmlFor="actives" className="text-base text-grey-8 font-medium">
          Collectivités utilisatrices de la plateforme
        </label>
      </div>
    </div>
  );
};

export default FiltreLabels;
