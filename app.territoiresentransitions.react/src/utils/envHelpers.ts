type EnumFromArray<T extends ReadonlyArray<unknown>> = T extends ReadonlyArray<
  infer ElementType
>
  ? ElementType
  : never;

type ProcessEnv = { [key: string]: string | undefined };

type ThrowIfNotInArrayParams<T> = {
  processEnv: ProcessEnv;
  authorizedValues: T[];
  variableName: string;
};

export const throwIfNotInArray = <T extends string>({
  processEnv,
  authorizedValues,
  variableName,
}: ThrowIfNotInArrayParams<T>): T => {
  if (!authorizedValues.includes(processEnv[variableName] as T))
    throw new Error(
      `${variableName} to be one of : ${authorizedValues.join(" | ")}, got : ${
        processEnv[variableName]
      }`,
    );
  return processEnv[variableName] as EnumFromArray<typeof authorizedValues>;
};

type ThrowIfVariableUndefinedParams = {
  processEnv: ProcessEnv;
  variableName: string;
};

export const throwIfVariableUndefined = ({
  processEnv,
  variableName,
}: ThrowIfVariableUndefinedParams) => {
  const variableValue = processEnv[variableName];
  if (!variableValue)
    throw new Error(`Environnement variable : ${variableName} was not set`);
  return variableValue;
};
