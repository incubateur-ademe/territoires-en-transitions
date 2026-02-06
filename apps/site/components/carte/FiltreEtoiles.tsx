'use client';

import { RedStar } from '@/site/components/labellisation/Star';
import { Checkbox } from '@tet/ui';
import { useEffect, useState } from 'react';

type FiltreEtoilesProps = {
  initEtoiles: number[];
  onChangeEtoiles: (etoiles: number[]) => void;
};

const FiltreEtoiles = ({
  initEtoiles,
  onChangeEtoiles,
}: FiltreEtoilesProps) => {
  const [etoiles, setEtoiles] = useState(
    [1, 2, 3, 4, 5].map((et) => {
      if (initEtoiles.includes(et)) return true;
      else return false;
    })
  );

  useEffect(() => {
    setEtoiles(
      [1, 2, 3, 4, 5].map((et) => {
        if (initEtoiles.includes(et)) return true;
        else return false;
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initEtoiles.length]);

  useEffect(() => {
    const etoilesFiltrees: number[] = [];
    etoiles.forEach((etoile, index) => {
      if (etoile) etoilesFiltrees.push(index + 1);
    });
    onChangeEtoiles(etoilesFiltrees);
  }, [etoiles, onChangeEtoiles]);

  return (
    <div className="flex flex-col items-start gap-4 ml-1">
      {etoiles.map((etoile, index) => (
        <Checkbox
          id={`${index + 1}etoiles`}
          key={index}
          name={`${index + 1}etoiles`}
          aria-describedby={`${index + 1} étoile(s)`}
          checked={etoile}
          onChange={() => {
            const values = [...etoiles];
            values[index] = !etoiles[index];
            setEtoiles(values);
          }}
          label={[1, 2, 3, 4, 5]
            .filter((e) => e <= index + 1)
            .map((e) => (
              <RedStar key={e} className="h-[19px] mt-0.5 mr-2" />
            ))}
        />
      ))}
    </div>
  );
};

export default FiltreEtoiles;
