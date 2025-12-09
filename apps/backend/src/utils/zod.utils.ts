import * as Zod from 'zod';
import * as zCore from 'zod/v4/core';

/**
 * support for both string query param and native type
 * @deprecated use strong type like `z.boolean()` instead
 * If the frontend sends a string, convert it to boolean before sending it to the backend
 */
export const zodQueryBoolean = Zod.z.union([
  Zod.z.boolean(),
  Zod.z.enum(['true', 'false']).transform((value) => value === 'true'),
  Zod.z.array(Zod.z.string()).transform((value) => value[0] === 'true'),
]);

export const getZodEnumArrayFromQueryString = (
  enumType: Zod.z.ZodEnum<any>
) => {
  return Zod.z.union([
    Zod.z
      .string()
      .transform((value) =>
        typeof value === 'string' ? value.split(',') : value
      )
      .pipe(enumType.array()),
    enumType.array(),
  ]);
};

export const getZodStringArrayFromQueryString = (
  trimStringAfterSplit = true
) => {
  return Zod.z.union([
    Zod.z
      .string()
      .transform((value) =>
        typeof value === 'string'
          ? value
              .split(',')
              .map((val) => (trimStringAfterSplit ? val.trim() : val))
          : value
      )
      .pipe(Zod.z.string().array()),
    Zod.z.string().array(),
  ]);
};

export const getPropertyPaths = (schema: zCore.$ZodType): string[] => {
  // Adjusted: Signature now uses Zod.ZodType to eliminate null& undefined check
  // check if schema is nullable or optional

  if (
    schema instanceof zCore.$ZodNullable ||
    schema instanceof zCore.$ZodOptional
  ) {
    return getPropertyPaths(schema._zod.def.innerType);
  }
  // check if schema is an array
  if (schema instanceof zCore.$ZodArray) {
    return getPropertyPaths(schema._zod.def.element);
  }
  // check if schema is an object
  if (schema instanceof zCore.$ZodObject) {
    // get key/value pairs from schema
    const entries = Object.entries<zCore.$ZodType>(schema._zod.def.shape); // Adjusted: Uses Zod.ZodType as generic to remove instanceof check. Since .shape returns ZodRawShape which has Zod.ZodType as type for each key.
    // loop through key/value pairs
    return entries.flatMap(([key, value]) => {
      // get nested keys
      const nested = getPropertyPaths(value).map(
        (subKey) => `${key}.${subKey}`
      );
      // return nested keys
      return nested.length ? nested : key;
    });
  }
  // return empty array
  return [];
};
