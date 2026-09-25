'use client';

import { RedStar } from '@/site/components/labellisation/Star';
import { Checkbox } from '@tet/ui';

const NIVEAUX = [1, 2, 3, 4, 5];

type FiltreEtoilesProps = {
  initEtoiles: number[];
  onChangeEtoiles: (etoiles: number[]) => void;
};

/**
 * Cases à cocher des niveaux de labellisation.
 *
 * Les niveaux cochés se lisent directement dans `initEtoiles` : les recopier
 * dans un état local obligeait à le resynchroniser dans un effet, et à
 * remonter la sélection dans un second — deux rendus en cascade pour une
 * valeur que le parent détient déjà.
 */
const FiltreEtoiles = ({
  initEtoiles,
  onChangeEtoiles,
}: FiltreEtoilesProps) => {
  return (
    <div className="flex flex-col items-start gap-4 ml-1">
      {NIVEAUX.map((niveau) => (
        <Checkbox
          id={`${niveau}etoiles`}
          key={niveau}
          name={`${niveau}etoiles`}
          aria-describedby={`${niveau} étoile(s)`}
          checked={initEtoiles.includes(niveau)}
          onChange={() =>
            onChangeEtoiles(
              initEtoiles.includes(niveau)
                ? initEtoiles.filter((etoile) => etoile !== niveau)
                : NIVEAUX.filter(
                    (n) => n === niveau || initEtoiles.includes(n)
                  )
            )
          }
          label={NIVEAUX.filter((n) => n <= niveau).map((n) => (
            <RedStar key={n} className="h-[19px] mt-0.5 mr-2" />
          ))}
        />
      ))}
    </div>
  );
};

export default FiltreEtoiles;
