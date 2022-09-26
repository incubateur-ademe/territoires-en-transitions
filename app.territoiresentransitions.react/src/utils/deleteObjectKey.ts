export const deleteObjectKey = <T>(object: T, key: keyof T) => {
  const objectCopy = {...object};
  delete objectCopy[key];
  return objectCopy;
};
