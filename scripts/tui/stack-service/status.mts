// Dérivation du glyphe de statut affiché à partir de l'état compose brut
// (state + healthcheck + code de sortie) — pure et sans dépendance sur
// StackService, pour raisonner état → glyphe attendu indépendamment du reste.
export interface StatusGlyph {
  symbol: string;
  color: string;
  label: string;
}

export const deriveStatus = (
  state: string,
  health: string,
  exitCode: number
): StatusGlyph => {
  if (state === 'running') {
    if (health === 'starting')
      return { symbol: '◐', color: 'yellow', label: 'starting' };
    if (health === 'unhealthy')
      return { symbol: '✗', color: 'red', label: 'unhealthy' };
    return { symbol: '●', color: 'green', label: health || 'running' };
  }
  if (state === 'restarting')
    return { symbol: '◐', color: 'yellow', label: 'restarting' };
  if (state === 'exited') {
    // Toujours gris, y compris code ≠ 0 : docker ne distingue pas un stop
    // manuel d'un crash (un next dev stoppé sort en 1), une croix rouge
    // serait trompeuse. Le code reste visible ; le rouge = unhealthy.
    return {
      symbol: '○',
      color: 'gray',
      label: exitCode === 0 ? 'exited' : `exited (${exitCode})`,
    };
  }
  return { symbol: '○', color: 'yellow', label: state || '?' };
};
