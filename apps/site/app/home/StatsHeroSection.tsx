import Section from '@/site/components/sections/Section';
import { TitreSection } from '@/site/components/sections/TitreSection';
import { Tooltip } from '@tet/ui';
import { isNil } from 'es-toolkit';
import { getStatsHeroSectionSite } from './getStatsHeroSectionSite';

const formatNumber = (n: number) => new Intl.NumberFormat('fr-FR').format(n);

const statItems = [
  {
    key: 'nb_ct_actif_12_mois' as const,
    label: 'Collectivités',
    tooltip: 'Nombre de collectivités actives sur les 12 derniers mois',
  },
  {
    key: 'nb_user_actif_12_mois' as const,
    label: 'Utilisateurs',
    tooltip: "Nombre d'utilisateurs actifs sur les 12 derniers mois",
  },
  {
    key: 'nb_pap_actif_12_mois' as const,
    label: "Plans d'action",
    tooltip: "Nombre de plans d'action actifs sur les 12 derniers mois",
  },
  {
    key: 'nb_action_pilotable_active_12_mois' as const,
    label: 'Actions',
    tooltip: "Nombre d'actions pilotables sur les 12 derniers mois",
  },
] as const;

export const StatsHeroSection = async () => {
  const stats = await getStatsHeroSectionSite();

  return (
    <Section containerClassName="bg-primary-0">
      <TitreSection>
        Rejoignez les collectivités qui pilotent leur transition
      </TitreSection>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 xl:gap-12">
        {statItems.map(({ key, label, tooltip }) => {
          const valeur = stats?.[key];
          if (isNil(valeur)) return null;
          return (
            <Tooltip key={key} label={tooltip}>
              <div className="flex flex-col items-center justify-center gap-2 text-center px-2">
                <span className="text-primary-9 text-6xl font-bold leading-none">
                  {formatNumber(valeur)}
                </span>
                <span className="text-primary-10 text-lg">{label}</span>
              </div>
            </Tooltip>
          );
        })}
      </div>
    </Section>
  );
};
