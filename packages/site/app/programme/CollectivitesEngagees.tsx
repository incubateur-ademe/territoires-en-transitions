'use client';

import { useConseillersCount } from '@/site/app/programme/useConseillersCount';
import {
  useCollectivitesEngagees,
  useTerritoiresCOT,
  useTerritoiresLabellises,
} from '@/site/app/stats/NombreCollectivitesEngagees';
import Section from '@/site/components/sections/Section';
import { Button } from '@/ui';
import posthog from 'posthog-js';

type CollectivitesEngageesProps = {
  titre: string;
  ctaCollectivites: string;
  ctaAnnuaire: string;
};

const CollectivitesEngagees = ({
  titre,
  ctaCollectivites,
  ctaAnnuaire,
}: CollectivitesEngageesProps) => {
  const { data: cot } = useTerritoiresCOT('', '');
  const { data: labellises } = useTerritoiresLabellises('', '');
  const { data: engages } = useCollectivitesEngagees('', '');
  const { data: conseillersCount } = useConseillersCount();

  return (
    <Section containerClassName="bg-primary-1 max-md:!py-6 md:max-lg:!py-12 lg:!py-18">
      <h3 className="text-primary-9 text-center mb-8">{titre}</h3>

      {/* besoin de cette div car `grid` semble rentrer en conflit avec le container `flex` sur Safari */}
      {cot !== undefined &&
        labellises !== undefined &&
        engages !== undefined &&
        conseillersCount !== undefined && (
          <div>
            <div className="grid grid-cols-4 max-md:grid-cols-1">
              <div className="h-full w-full flex flex-col justify-center items-center gap-2 px-8 max-md:pb-8 max-md:border-b md:border-r border-primary-5">
                <span className="text-primary-8 text-7xl font-extrabold">
                  {engages}
                </span>
                <span className="text-primary-10 text-lg text-center">
                  Territoires Engagés Transition Écologique
                </span>
              </div>
              <div className="h-full w-full flex flex-col justify-center items-center gap-2 px-8 max-md:py-8 max-md:border-b md:border-r border-primary-5">
                <span className="text-primary-8 text-7xl font-extrabold">
                  {labellises}
                </span>
                <span className="text-primary-10 text-lg text-center">
                  Collectivités labellisées
                </span>
              </div>
              <div className="h-full w-full flex flex-col justify-center items-center gap-2 px-8 max-md:py-8 max-md:border-b md:border-r border-primary-5">
                <span className="text-primary-8 text-7xl font-extrabold">
                  {cot}
                </span>
                <span className="text-primary-10 text-lg text-center">
                  Contrats d’Objectif Territorial (COT)
                </span>
              </div>
              <div className="h-full w-full flex flex-col justify-center items-center gap-2 px-8 max-md:pt-8">
                <span className="text-primary-8 text-7xl font-extrabold">
                  {conseillersCount}
                </span>
                <span className="text-primary-10 text-lg text-center">
                  Conseillers⸱ères pour vous accompagner
                </span>
              </div>
            </div>
          </div>
        )}

      <div className="flex flex-wrap justify-center gap-4 mx-auto mt-12">
        <Button
          href="/collectivites"
          onClick={() => posthog.capture('voir_collectivites')}
        >
          {ctaCollectivites}
        </Button>
        <Button href="/programme/annuaire" variant="outlined">
          {ctaAnnuaire}
        </Button>
      </div>
    </Section>
  );
};

export default CollectivitesEngagees;
