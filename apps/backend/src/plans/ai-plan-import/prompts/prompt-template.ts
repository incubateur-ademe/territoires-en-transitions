export type Prompt<Key extends string> = {
  readonly template: string;
  readonly placeholders: Readonly<Record<Key, string>>;
};

export const definePrompt = <const Key extends string>(
  prompt: Prompt<Key>
): Prompt<Key> => prompt;

export const generatePrompt = <Key extends string>(
  { template, placeholders }: Prompt<Key>,
  values: Record<Key, string>
): string =>
  (Object.keys(placeholders) as Key[]).reduce<string>(
    (filled, key) => filled.replaceAll(placeholders[key], () => values[key]),
    template
  );
