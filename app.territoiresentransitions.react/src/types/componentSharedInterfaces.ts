export type Option<T extends string> = { value: T; label: string };
export type Options<T extends string> = Option<T>[];
