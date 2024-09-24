'use client';

import Section from '@components/sections/Section';
import {Button} from '@tet/ui';
import {
  useCollectivitesEngagees,
  useTerritoiresCOT,
  useTerritoiresLabellises,
} from 'app/stats/NombreCollectivitesEngagees';

type CollectivitesEngageesProps = {
  titre: string;
  cta: string;
};

const CollectivitesEngagees = ({titre, cta}: CollectivitesEngageesProps) => {
  const {data: cot} = useTerritoiresCOT('', '');
  const {data: labellises} = useTerritoiresLabellises('', '');
  const {data: engages} = useCollectivitesEngagees('', '');

  return (
    <Section containerClassName="bg-primary-1 max-md:!py-6 md:max-lg:!py-12 lg:!py-18">
      <h3 className="text-primary-9 text-center mb-4">{titre}</h3>

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
          <span className="text-primary-8 text-7xl font-extrabold">{cot}</span>
          <span className="text-primary-10 text-lg text-center">
            Contrats d’Objectif Territorial (COT)
          </span>
        </div>
      </div>

      <Button className="mx-auto max-md:mt-3 mt-6" href="/collectivites">
        {cta}
      </Button>
    </Section>
  );
};

export default CollectivitesEngagees;
