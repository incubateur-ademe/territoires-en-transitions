import { Etoile } from '@tet/domain/referentiels';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RequestableAuditStar } from './audit-selection';
import { TargetStarField } from './target-star.field';

const STAR_LABELS: Record<RequestableAuditStar, string> = {
  2: 'deuxième étoile',
  3: 'troisième étoile',
  4: 'quatrième étoile',
  5: 'cinquième étoile',
};

const openStarOptions = (maximumRequestableStar: Etoile): void => {
  render(
    <TargetStarField
      maximumRequestableStar={maximumRequestableStar}
      value={null}
      onChange={vi.fn()}
    />
  );
  fireEvent.click(screen.getByRole('button'));
};

const offeredStars = (): RequestableAuditStar[] =>
  ([2, 3, 4, 5] as const).filter(
    (star) => screen.queryAllByText(STAR_LABELS[star]).length > 0
  );

describe('TargetStarField', () => {
  it.each<[Etoile, RequestableAuditStar[]]>([
    [2, [2]],
    [3, [2, 3]],
    [4, [2, 3, 4]],
    [5, [2, 3, 4, 5]],
  ])(
    "étoile-objectif %i : n'offre aucune étoile au-dessus, soit %j",
    (maximumRequestableStar, expectedStars) => {
      openStarOptions(maximumRequestableStar);
      expect(offeredStars()).toEqual(expectedStars);
    }
  );

  it("n'offre aucune étoile quand aucune n'est auditable", () => {
    openStarOptions(1);
    expect(offeredStars()).toEqual([]);
  });

  it("émet l'étoile choisie", () => {
    const onChange = vi.fn();
    render(
      <TargetStarField
        maximumRequestableStar={3}
        value={null}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText(STAR_LABELS[3]));
    expect(onChange).toHaveBeenCalledWith(3);
  });
});
