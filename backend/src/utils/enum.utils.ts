export function getEnumValues<Enum extends string>(
  enumObj: Record<string, Enum>
) {
  // Returns as a non-empty array
  return Object.values(enumObj) as [Enum, ...Enum[]];
}
