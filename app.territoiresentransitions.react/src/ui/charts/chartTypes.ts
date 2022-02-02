export type AxisAvancementSample = {
  label: string[][];
  percentages: {
    fait: number;
    programme: number;
    pas_fait: number;
    non_renseigne: number;
  };
  potentielPoints: number;
};
