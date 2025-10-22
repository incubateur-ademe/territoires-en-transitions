import { makeCollectiviteToutesLesFichesUrl } from '@/app/app/paths';

export type CompletionFieldKey =
  | 'titre'
  | 'description'
  | 'statut'
  | 'pilotes'
  | 'objectifs'
  | 'indicateurs'
  | 'budgets'
  | 'suiviRecent';

type CompletionMessage = {
  title: string;
  subtitle: (count: number) => string;
  description: string;
  buttonLabel: string;
  getButtonLink: (collectiviteId: number, planId: number) => string;
};

export const COMPLETION_MESSAGES: Record<
  CompletionFieldKey,
  CompletionMessage
> = {
  titre: {
    title: 'Donnez un titre à vos actions',
    subtitle: (count: number) => `${count} actions n'ont pas de titre`,
    description:
      'Un titre clair facilite le pilotage et la communication de vos actions.',
    buttonLabel: 'Compléter les titres',
    getButtonLink: (collectiviteId, planId) =>
      makeCollectiviteToutesLesFichesUrl({
        collectiviteId,
        searchParams: `pa=${planId}&nti=true`,
      }),
  },
  description: {
    title: 'Décrivez vos actions',
    subtitle: (count: number) => `${count} actions n'ont pas de description`,
    description:
      'Une description aide vos équipes à comprendre le contexte et les enjeux de chaque action.',
    buttonLabel: 'Ajouter des descriptions',
    getButtonLink: (collectiviteId, planId) =>
      makeCollectiviteToutesLesFichesUrl({
        collectiviteId,
        searchParams: `pa=${planId}&nde=true`,
      }),
  },
  statut: {
    title: "Suivez l'avancement de vos actions",
    subtitle: (count: number) => `${count} actions n'ont pas de statut`,
    description:
      'Le statut permet de visualiser rapidement où en sont vos actions.',
    buttonLabel: 'Définir les statuts',
    getButtonLink: (collectiviteId, planId) =>
      makeCollectiviteToutesLesFichesUrl({
        collectiviteId,
        searchParams: `pa=${planId}&sss=true`,
      }),
  },
  pilotes: {
    title: 'Responsabilisez vos équipes',
    subtitle: (count: number) => `${count} actions n'ont pas de pilote`,
    description:
      'Attribuer un pilote améliore le suivi et clarifie les responsabilités.',
    buttonLabel: 'Assigner des pilotes',
    getButtonLink: (collectiviteId, planId) =>
      makeCollectiviteToutesLesFichesUrl({
        collectiviteId,
        searchParams: `pa=${planId}&ssp=true`,
      }),
  },
  objectifs: {
    title: 'Définissez des objectifs',
    subtitle: (count: number) =>
      `${count} actions ne sont pas reliées à un objectif`,
    description:
      'Lier une action à un objectif stratégique renforce la cohérence de votre plan.',
    buttonLabel: 'Associer des objectifs',
    getButtonLink: (collectiviteId, planId) =>
      makeCollectiviteToutesLesFichesUrl({
        collectiviteId,
        searchParams: `pa=${planId}&nob=true`,
      }),
  },
  indicateurs: {
    title: "Mesurez l'impact de vos actions",
    subtitle: (count: number) => `${count} actions n'ont pas d'indicateurs`,
    description:
      'Les indicateurs permettent de suivre concrètement les résultats obtenus.',
    buttonLabel: 'Ajouter des indicateurs',
    getButtonLink: (collectiviteId, planId) =>
      makeCollectiviteToutesLesFichesUrl({
        collectiviteId,
        searchParams: `pa=${planId}&il=false`,
      }),
  },
  budgets: {
    title: 'Chiffrez vos moyens',
    subtitle: (count: number) =>
      `${count} actions n'ont pas de budget renseigné`,
    description:
      "Indiquer les ressources (€ ou ETP) facilite l'arbitrage et le suivi financier.",
    buttonLabel: 'Renseigner les budgets',
    getButtonLink: (collectiviteId, planId) =>
      makeCollectiviteToutesLesFichesUrl({
        collectiviteId,
        searchParams: `pa=${planId}&nb=true`,
      }),
  },
  suiviRecent: {
    title: 'Actualisez le suivi de vos actions',
    subtitle: (count: number) =>
      `${count} actions n'ont pas été mises à jour depuis 1 an`,
    description:
      'Un suivi régulier garantit que votre plan évolue efficacement et reste sous contrôle.',
    buttonLabel: 'Mettre à jour le suivi',
    getButtonLink: (collectiviteId, planId) =>
      makeCollectiviteToutesLesFichesUrl({
        collectiviteId,
        searchParams: `pa=${planId}&nmu=true`,
      }),
  },
};
