'use client';

import { RedStar } from '@tet/site/components/labellisation/Star';
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
    <div className="flex flex-col items-start gap-4">
      {etoiles.map((etoile, index) => (
        <div key={index + 1} className="fr-checkbox-group">
          <input
            name={`${index + 1}etoiles`}
            id={`${index + 1}etoiles`}
            type="checkbox"
            aria-describedby={`${index + 1} étoile(s)`}
            checked={etoile}
            onChange={() => {
              const values = [...etoiles];
              values[index] = !etoiles[index];
              setEtoiles(values);
            }}
          />
          <label htmlFor={`${index + 1}etoiles`} className="hover:shadow-none">
            {[1, 2, 3, 4, 5]
              .filter((e) => e <= index + 1)
              .map((e) => (
                <RedStar key={e} className="h-[23px] w-[26px]" />
              ))}
          </label>
        </div>
      ))}
    </div>
  );
};

export default FiltreEtoiles;
