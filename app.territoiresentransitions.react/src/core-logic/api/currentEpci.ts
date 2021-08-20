/**
 * Returns the current epci id using the current location path.
 *
 * Used to avoid circular dependencies as hooks can depend on state and stores,
 * the stores should avoid depending on state.
 */
export const getCurrentEpciId = (): string | undefined => {
  const parts = window.location.pathname.split('/');
  if (parts.length > 2 && parts[1] === 'collectivite') {
    return parts[2];
  }
  return;
};
