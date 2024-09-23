'use client';

import Section from '@components/sections/Section';
import {
  useCollectivitesEngagees,
  useTerritoiresLabellises,
} from 'app/stats/NombreCollectivitesEngagees';
import {useActiveUsers} from './stats/ActiveUsers';

type CommunauteProps = {
  titre: string;
};

const Communaute = ({titre}: CommunauteProps) => {
  const {data: labellises} = useTerritoiresLabellises('', '');
  const {data: engages} = useCollectivitesEngagees('', '');
  const {data: utilisateurs} = useActiveUsers('', '');
  const utilisateursActifs = utilisateurs
    ? utilisateurs.courant.total_utilisateurs
    : undefined;

  return (
    <Section containerClassName="max-md:!py-6 md:max-lg:!py-12 lg:!py-18">
      <h3 className="text-primary-9 text-center">{titre}</h3>

      <div className="flex max-md:flex-col justify-center items-center">
        <div className="flex flex-col items-center gap-2 w-96 max-w-full max-md:px-8 max-md:pb-8 md:px-16 max-md:border-b md:border-r border-primary-5">
          <span className="text-primary-8 text-7xl font-extrabold">
            {engages}
          </span>
          <span className="text-primary-10 text-lg text-center">
            Territoires Engagés Transition Écologique
          </span>
        </div>
        <div className="flex flex-col items-center gap-2 w-96 max-w-full max-md:p-8 md:px-16 max-md:border-b md:border-r border-primary-5">
          <span className="text-primary-8 text-7xl font-extrabold">
            {labellises}
          </span>
          <span className="text-primary-10 text-lg text-center">
            Collectivités labellisées
          </span>
        </div>
        <div className="flex flex-col items-center gap-2 w-96 max-w-full max-md:px-8 max-md:pt-8 md:px-16">
          <span className="text-primary-8 text-7xl font-extrabold">
            {utilisateursActifs}
          </span>
          <span className="text-primary-10 text-lg text-center">
            Utilisateurs de l’outil numérique
          </span>
        </div>
      </div>
    </Section>
  );
};

export default Communaute;
