import { appLabels } from '@/app/labels/catalog';
import { format, startOfYear, subMonths, subYears } from 'date-fns';

export const periodeEvolutionValues = [
  'debut-annee',
  '1-mois',
  '3-mois',
  '6-mois',
  '12-mois',
  '2-ans',
  '3-ans',
  'debut-plan',
  'personnalisee',
] as const;

export type PeriodeEvolution = (typeof periodeEvolutionValues)[number];

export const PERIODE_EVOLUTION_PAR_DEFAUT =
  'debut-annee' satisfies PeriodeEvolution;

export const periodeEvolutionOptions: {
  value: PeriodeEvolution;
  label: string;
}[] = [
  { value: 'debut-annee', label: appLabels.evolutionStatutsDebutAnnee },
  { value: '1-mois', label: appLabels.evolutionStatutsDernierMois },
  { value: '3-mois', label: appLabels.evolutionStatutsDerniersMois(3) },
  { value: '6-mois', label: appLabels.evolutionStatutsDerniersMois(6) },
  { value: '12-mois', label: appLabels.evolutionStatutsDerniersMois(12) },
  { value: '2-ans', label: appLabels.evolutionStatutsDernieresAnnees(2) },
  { value: '3-ans', label: appLabels.evolutionStatutsDernieresAnnees(3) },
  { value: 'debut-plan', label: appLabels.evolutionStatutsDebutPlan },
  { value: 'personnalisee', label: appLabels.evolutionStatutsPersonnalisee },
];

const toIsoDate = (date: Date) => format(date, 'yyyy-MM-dd');

export const getAujourdhui = () => toIsoDate(new Date());

export const getDateDebutPeriode = (
  periode: Exclude<PeriodeEvolution, 'personnalisee'>,
  dateDebutPlan: string
): string => {
  const aujourdhui = new Date();
  switch (periode) {
    case 'debut-annee':
      return toIsoDate(startOfYear(aujourdhui));
    case '1-mois':
      return toIsoDate(subMonths(aujourdhui, 1));
    case '3-mois':
      return toIsoDate(subMonths(aujourdhui, 3));
    case '6-mois':
      return toIsoDate(subMonths(aujourdhui, 6));
    case '12-mois':
      return toIsoDate(subMonths(aujourdhui, 12));
    case '2-ans':
      return toIsoDate(subYears(aujourdhui, 2));
    case '3-ans':
      return toIsoDate(subYears(aujourdhui, 3));
    case 'debut-plan': {
      const debut = dateDebutPlan.slice(0, 10);
      const fin = toIsoDate(aujourdhui);
      return debut < fin ? debut : fin;
    }
  }
};

export const formatDateCourte = (isoDate: string) =>
  format(new Date(`${isoDate}T00:00:00`), 'dd/MM/yyyy');
