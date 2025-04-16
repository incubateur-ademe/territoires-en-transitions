'use client';

import { useConseillersCount } from '@/site/app/programme/useConseillersCount';
import {
  useCollectivitesEngagees,
  useTerritoiresCOT,
  useTerritoiresLabellises,
} from '@/site/app/stats/NombreCollectivitesEngagees';
import Section from '@/site/components/sections/Section';
import { Button } from '@/ui';
import classNames from 'classnames';
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
  const { data: cot, isLoading: isCotLoading } = useTerritoiresCOT('', '');
  const { data: labellises, isLoading: isLabellisesLoading } =
    useTerritoiresLabellises('', '');
  const { data: engages, isLoading: isEngagesLoading } =
    useCollectivitesEngagees('', '');
  const { data: conseillersCount, isLoading: isConseillersCountLoading } =
    useConseillersCount();

  const displayData =
    !isCotLoading &&
    !isLabellisesLoading &&
    !isEngagesLoading &&
    !isConseillersCountLoading;

  return (
    <Section containerClassName="bg-primary-1 max-md:!py-6 md:max-lg:!py-12 lg:!py-18">
      <h3 className="text-primary-9 text-center mb-8">{titre}</h3>

      {/* besoin de cette div car `grid` semble rentrer en conflit avec le container `flex` sur Safari */}
      {displayData && (
        <div>
          <div className="grid grid-cols-4 max-md:grid-cols-1">
            <ListElement
              label="Territoires Engagés Transition Écologique"
              value={engages}
              className="max-md:pt-0"
            />

            <ListElement label="Collectivités labellisées" value={labellises} />

            <ListElement
              label="Contrats d’Objectif Territorial (COT)"
              value={cot}
            />

            <ListElement
              label=" Conseillers⸱ères pour vous accompagner"
              value={conseillersCount}
              className="max-md:pb-0 border-none"
            />
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

type ListElementProps = {
  label: string;
  value: number | undefined;
  className?: string;
};

const ListElement = ({ label, value, className }: ListElementProps) => {
  return (
    <div
      className={classNames(
        'h-full w-full flex flex-col justify-center items-center gap-2 px-8 max-md:py-8 max-md:border-b md:border-r border-primary-5',
        className
      )}
    >
      <span className="text-primary-8 text-7xl font-extrabold">
        {value ?? '-'}
      </span>
      <span className="text-primary-10 text-lg text-center">{label}</span>
    </div>
  );
};
