export const READ_ONLY_TOOL_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

export const collectiviteIdInput = {
  collectiviteId: {
    description: 'Identifiant TeT de la collectivité',
  },
} as const;
