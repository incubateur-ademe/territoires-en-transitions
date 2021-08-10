/**
 * Data that can be stored at path/id.
 */
export interface Storable {
  id: string;
  pathname: string;
}

/**
 * Storable type guard.
 */
export const isStorable = (storable: any): storable is Storable => {
  return (
    (storable as Storable).id !== undefined &&
    (storable as Storable).pathname !== undefined
  );
};
