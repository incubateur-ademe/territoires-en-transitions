export const deleteObjectKey = (object: any, key: string) => {
  const objectCopy = {...object};
  delete objectCopy[key];
  return objectCopy;
};
