import { plural } from '@tet/ui/labels/plural';

export const collectivitesLabels = {
  collectivite: plural({ one: 'collectivité', other: 'collectivités' }),
  collectivitesActives: plural({
    one: 'collectivité active',
    other: 'collectivités actives',
  }),
  correspondAVotreRecherche: ({
    count,
    label,
  }: {
    count: number | string;
    label: string;
  }): string =>
    `${label} ${
      count === 1 ? 'correspond' : 'correspondent'
    } à votre recherche`,
};
