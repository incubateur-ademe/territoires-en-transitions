/**
 * Permet de créer un objet jouant le rôle d'enum à partir d'une liste de chaînes
 *
 * Usage :
 * ```
 * const Color = [ "Red", "Green", "Blue" ] as const
 * const ColorEnum = createEnumObject(Color);
 *
 * const colorEnum = pgEnum("color", Color);
 * const colorSchema = z.enum(Color);
 * const table = pgTable("table",{enum: colorEnum("enum")});
 * db.insert(table).values({enum: ColorEnum.BLUE});
 * ```
 *
 * Ref: https://github.com/drizzle-team/drizzle-orm/discussions/1914#discussioncomment-8816193
 */
export const createEnumObject = <T extends readonly [string, ...string[]]>(
  values: T
): {
  [K in T[number] as Uppercase<K>]: K;
} => {
  const obj: Record<string, T[number]> = {};
  for (const value of values) {
    obj[value.toUpperCase()] = value;
  }
  return obj as {
    [K in T[number] as Uppercase<K>]: K;
  };
};

