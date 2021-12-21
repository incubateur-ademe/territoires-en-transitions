import {indicateurResultatRepository} from 'core-logic/api/repositories/AnyIndicateurRepository';
import {AnyIndicateurValueRead} from 'generated/dataLayer/any_indicateur_value_write';
import {useEffect, useState} from 'react';

export const useIndicateurValuesForAllYears = ({
  collectiviteId,
  indicateurId,
}: {
  collectiviteId: number;
  indicateurId: string;
}) => {
  const [indicateurValuesForAllYears, setIndicateurValuesForAllYears] =
    useState<AnyIndicateurValueRead[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const fetched = await indicateurResultatRepository.fetchIndicateurForId({
        collectiviteId,
        indicateurId,
      });
      setIndicateurValuesForAllYears(fetched);
    };
    indicateurResultatRepository.writeEndpoint.addListener(fetch);
    fetch();
    return () => {
      indicateurResultatRepository.writeEndpoint.removeListener(fetch);
    };
  });
  console.log('indicateurValuesForAllYears : ', indicateurValuesForAllYears);
  return indicateurValuesForAllYears;
};

// export const useFicheAction = (collectiviteId: number, uid: string) => {
//   const [fiche, setFiche] = useState<FicheActionRead | null>(null);

//   useEffect(() => {
//     const fetch = async () => {
//       const fiche = await indicateurRepo.fetchFicheAction({
//         collectiviteId: collectiviteId,
//         ficheActionUid: uid,
//       });
//       setFiche(fiche);
//     };
//     ficheActionWriteEndpoint.addListener(fetch);
//     fetch();
//     return () => {
//       ficheActionWriteEndpoint.removeListener(fetch);
//     };
//   });

//   return fiche;
// };
