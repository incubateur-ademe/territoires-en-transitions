export const analysisStepEnumValues = [
  'classification',
  'mobilisation',
] as const;

export type AnalysisStep = (typeof analysisStepEnumValues)[number];
