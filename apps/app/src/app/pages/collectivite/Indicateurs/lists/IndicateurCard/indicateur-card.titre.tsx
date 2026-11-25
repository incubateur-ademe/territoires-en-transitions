import { appLabels } from '@/app/labels/catalog';
import type { IndicateurDetaille } from '@tet/domain/indicateurs';
import type { JSX, PropsWithChildren } from 'react';

type Props = PropsWithChildren<{
  ancestors: IndicateurDetaille['ancestors'];
  titre: string;
}>;

export const IndicateurCardTitre = ({
  ancestors,
  titre,
  children,
}: Props): JSX.Element => (
  <>
    {ancestors.length > 0 && (
      <span className="block truncate font-normal text-grey-7">
        {ancestors
          .map(
            (ancestor) =>
              `${ancestor.titre} ${appLabels.indicateurSeparateurAncetres} `
          )
          .join('')}
      </span>
    )}
    <span className="block line-clamp-2">
      {titre}
      {children}
    </span>
  </>
);
