export type Freshness = 'up-to-date' | 'outdated' | 'unknown-commit';

export type DesignSystemGit = Readonly<{
  isKnownCommit: (commit: string) => boolean;
  hasChangesSince: (commit: string) => boolean;
}>;

export const freshnessOf = ({
  git,
  publishedCommit,
}: Readonly<{
  git: DesignSystemGit;
  publishedCommit: string;
}>): Freshness => {
  if (!git.isKnownCommit(publishedCommit)) return 'unknown-commit';
  return git.hasChangesSince(publishedCommit) ? 'outdated' : 'up-to-date';
};
