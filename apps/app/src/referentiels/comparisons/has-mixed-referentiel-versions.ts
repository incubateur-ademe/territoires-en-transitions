type WithReferentielVersion = { referentielVersion?: string | null };

/** Les sauvegardes sans version connue (anciennes) ne comptent pas comme une version différente. */
export const hasMixedReferentielVersions = (
  snapshots: WithReferentielVersion[]
): boolean =>
  new Set(
    snapshots
      .map((snapshot) => snapshot.referentielVersion)
      .filter((version): version is string => Boolean(version))
  ).size > 1;
