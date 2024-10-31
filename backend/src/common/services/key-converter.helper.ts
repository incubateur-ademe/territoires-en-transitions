export const snakeToCamelCase = (snakeCase: string): string => {
  return snakeCase.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

export const convertObjectKeysToCamelCase = (
  obj: Record<string, any>
): Record<string, any> => {
  const newObj: Record<string, any> = {};
  for (const key in obj) {
    if (Object.hasOwnProperty.call(obj, key)) {
      const camelCaseKey = snakeToCamelCase(key);
      newObj[camelCaseKey] = obj[key];
    }
  }
  return newObj;
};
