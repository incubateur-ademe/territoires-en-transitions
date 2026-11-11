// Ces noms identifient les versions déjà publiées ; les préserver lors des refactorings.
export const electrificationStorageConfig = {
  bucket: 'plans-electrification-data',
  activeVersionFile: 'active.json',
  versionsDirectory: 'versions',
  mimeType: 'application/json',
} as const;
