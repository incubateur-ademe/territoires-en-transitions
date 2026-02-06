import { defaultUserPreferences, UserPreferences } from '@tet/domain/users';
import { flattenObject } from 'es-toolkit';
import z from 'zod';

// liste des clés acceptées pour l'indexation par chemin "domain.scope.prefKey"
export type UserPreferenceKey = FlattenObjectKeys<UserPreferences>;
const userPreferenceKeys = Object.keys(
  flattenObject(defaultUserPreferences)
) as UserPreferenceKey[];

export const userPreferenceKeySchema = z.enum(userPreferenceKeys);

// transforme récursivement les clés d'un type objet en une union de chaînes
// permet de générer le typage pour `userPreferenceKeys`
// ref: https://www.raygesualdo.com/posts/flattening-object-keys-with-typescript-types/
export type FlattenObjectKeys<
  T extends Record<string, unknown>,
  Key = keyof T
> = Key extends string
  ? T[Key] extends Record<string, unknown>
    ? `${Key}.${FlattenObjectKeys<T[Key]>}`
    : `${Key}`
  : never;

// fait l'opération inverse de flattenObject
export function unflattenPreferences<
  T extends Partial<Record<FlattenObjectKeys<UserPreferences>, unknown>>
>(object: T): Partial<UserPreferences> {
  const res: Record<string, unknown> = {};
  for (const key in object) {
    const keys = key.split('.');
    keys.reduce<Record<string, unknown>>((acc, value, index) => {
      // vérifie si la clé existe déjà et est un objet, sinon crée un nouvel objet ou assigne la valeur
      if (
        !(value in acc) ||
        typeof acc[value] !== 'object' ||
        acc[value] === null
      ) {
        acc[value] = keys.length - 1 === index ? object[key] : {};
      }
      return acc[value] as Record<string, unknown>;
    }, res);
  }
  return res as Partial<UserPreferences>;
}
