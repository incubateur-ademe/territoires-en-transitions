export const etapeAnalyseEnumValues = [
  'classification',
  'mobilisation',
] as const;

export type EtapeAnalyse = (typeof etapeAnalyseEnumValues)[number];
