'use client';

import { useActiveUsers } from '../stats/ActiveUsers';
import { useEvolutionTotalActivation } from '../stats/EvolutionTotalActivationParType';

const ChiffresClefs = () => {
  const { data: evolutionActivation } = useEvolutionTotalActivation('', '');
  const collectivitesActivees = evolutionActivation
    ? evolutionActivation.courant.total
    : undefined;

  const { data: activeUsers } = useActiveUsers('', '');
  const totalUtilisateurs = activeUsers
    ? activeUsers.courant.total_utilisateurs
    : undefined;

  return (
    <div className="grid sm:max-lg:grid-cols-2 xl:grid-cols-2 md:gap-10">
      {!!collectivitesActivees && (
        <div className="bg-grey-1 max-md:bg-primary-1 md:rounded-xl py-8 px-6 flex flex-col max-md:items-center justify-center">
          <span className="text-primary-7 text-5xl leading-8 font-bold">
            {collectivitesActivees}
          </span>
          <p className="text-primary-10 text-2xl leading-8 font-bold mt-2 mb-0">
            Collectivités activées
          </p>
          <a
            href="/stats"
            className="text-primary-5 text-[0.6rem] font-bold w-fit"
            target="_blank"
            rel="noreferrer noopener"
          >
            Toutes nos statistiques
          </a>
        </div>
      )}

      {!!totalUtilisateurs && (
        <div className="bg-grey-1 max-md:bg-primary-1 md:rounded-xl py-9 px-8 flex flex-col max-md:items-center justify-center">
          <span className="text-primary-7 text-5xl leading-8 font-bold">
            {totalUtilisateurs}
          </span>
          <p className="text-primary-10 text-xl leading-8 font-bold mt-2 mb-0">
            Utilisateurs
          </p>
        </div>
      )}
    </div>
  );
};

export default ChiffresClefs;
