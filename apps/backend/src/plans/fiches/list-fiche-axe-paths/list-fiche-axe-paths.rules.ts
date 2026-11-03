import {
  AxePath,
  FicheAxePaths,
} from '@tet/backend/collectivites/analysis/analyze-fiches/fiche-axe-path.repository';
import { groupBy, sortBy, uniq, uniqBy } from 'es-toolkit';

type FicheAxeLink = {
  readonly ficheId: number;
  readonly axeId: number;
};

type AxeAncestry = readonly { readonly nom: string | null }[];

const AXE_PATH_KEY_SEPARATOR = '\u0000';

const toAxePathKey = (axePath: AxePath): string =>
  axePath.join(AXE_PATH_KEY_SEPARATOR);

export const toFicheAxePaths = ({
  ficheIds,
  links,
  ancestryByAxeId,
}: {
  ficheIds: readonly number[];
  links: readonly FicheAxeLink[];
  ancestryByAxeId: Readonly<Record<number, AxeAncestry>>;
}): FicheAxePaths[] => {
  const linksByFicheId = groupBy(links, ({ ficheId }) => ficheId);

  return uniq(ficheIds).map((ficheId) => {
    const axePaths = (linksByFicheId[ficheId] ?? [])
      .map(({ axeId }) =>
        (ancestryByAxeId[axeId] ?? []).map(({ nom }) => nom ?? '')
      )
      .filter((axePath) => axePath.length > 0);

    return {
      ficheId,
      axePaths: sortBy(uniqBy(axePaths, toAxePathKey), [toAxePathKey]),
    };
  });
};
