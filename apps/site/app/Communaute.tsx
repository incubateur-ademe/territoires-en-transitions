'use client';

import {
  useCollectivitesEngagees,
  useTerritoiresLabellises,
} from '@/site/app/stats/NombreCollectivitesEngagees';
import Section from '@/site/components/sections/Section';
import { Button } from '@/ui';
import { useActiveUsers } from './stats/ActiveUsers';

type CommunauteProps = {
  titre: string;
  cta: string;
};

const Communaute = ({ titre, cta }: CommunauteProps) => {
  const { data: labellises } = useTerritoiresLabellises('', '');
  const { data: engages } = useCollectivitesEngagees('', '');
  const { data: utilisateurs } = useActiveUsers('', '');
  const utilisateursActifs = utilisateurs
    ? utilisateurs.courant.total_utilisateurs
    : undefined;

  return (
    <Section containerClassName="max-md:!py-6 md:max-lg:!py-12 lg:!py-18">
      <h3 className="text-primary-9 text-center">{titre}</h3>

      {/* besoin de cette div car `grid` semble rentrer en conflit avec le container `flex` sur Safari */}
      <div>
        <div className="grid grid-cols-3 max-md:grid-cols-1">
          <div className="h-full w-full flex flex-col justify-center items-center gap-2 max-md:px-8 max-md:pb-8 md:px-16 max-md:border-b md:border-r border-primary-5">
            <span className="text-primary-8 text-7xl font-extrabold">
              {engages}
            </span>
            <span className="text-primary-10 text-lg text-center">
              Territoires Engagés Transition Écologique
            </span>
          </div>
          <div className="h-full w-full flex flex-col justify-center items-center gap-2 max-md:p-8 md:px-16 max-md:border-b md:border-r border-primary-5">
            <span className="text-primary-8 text-7xl font-extrabold">
              {labellises}
            </span>
            <span className="text-primary-10 text-lg text-center">
              Collectivités labellisées
            </span>
          </div>
          <div className="h-full w-full flex flex-col justify-center items-center gap-2 max-md:px-8 max-md:pt-8 md:px-16">
            <span className="text-primary-8 text-7xl font-extrabold">
              {utilisateursActifs}
            </span>
            <span className="text-primary-10 text-lg text-center">
              Utilisateurs de l’outil numérique
            </span>
          </div>
        </div>
      </div>

      <Button className="mx-auto max-md:mt-3 mt-6" href="/collectivites">
        {cta}
      </Button>
    </Section>
  );
};

export default Communaute;
