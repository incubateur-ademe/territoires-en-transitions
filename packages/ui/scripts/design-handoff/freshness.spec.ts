import { describe, expect, it } from 'vitest';
import { freshnessOf, type DesignSystemGit } from './freshness.ts';

const gitOf = ({
  knownCommits,
  changedSince,
}: Readonly<{
  knownCommits: ReadonlyArray<string>;
  changedSince: ReadonlyArray<string>;
}>): DesignSystemGit => ({
  isKnownCommit: (commit) => knownCommits.includes(commit),
  hasChangesSince: (commit) => changedSince.includes(commit),
});

describe('freshnessOf', () => {
  const git = gitOf({
    knownCommits: ['aaa1111', 'bbb2222'],
    changedSince: ['aaa1111'],
  });

  it('dit périmé quand @tet/ui a changé depuis le commit publié', () => {
    expect(freshnessOf({ git, publishedCommit: 'aaa1111' })).toBe('outdated');
  });

  it('dit à jour quand rien n’a changé depuis le commit publié', () => {
    expect(freshnessOf({ git, publishedCommit: 'bbb2222' })).toBe('up-to-date');
  });

  it('ne conclut pas sur un commit inconnu, par exemple après un squash', () => {
    expect(freshnessOf({ git, publishedCommit: 'ccc3333' })).toBe(
      'unknown-commit'
    );
  });
});
