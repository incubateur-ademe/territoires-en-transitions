import { makeCollectiviteToutesLesFichesUrl } from '@/app/app/paths';
import { nameToparams } from '@/app/plans/fiches/list-all-fiches/filters/filters-search-parameters-mapper';
import { WITHOUT_RECENT } from '@/app/plans/fiches/list-all-fiches/filters/types';
import { CompletionFieldName } from '@/domain/plans';

type CompletionMessage = {
  title: string;
  subtitle: (count: number) => string;
  description: string;
  buttonLabel: string;
  getButtonLink: (collectiviteId: number, planId: number) => string;
};

export const COMPLETION_MESSAGES: Record<
  CompletionFieldName,
  CompletionMessage
> = {
  titre: {
    title: 'Donnez un titre à vos actions',
    subtitle: (count: number) =>
      `${count} ${pluralizeAction(count)} ${pluralizeVerb(count)} pas de titre`,
    description:
      'Un titre clair facilite le pilotage et la communication de vos actions.',
    buttonLabel: 'Compléter les titres',
    getButtonLink: (collectiviteId, planId) =>
      makeCollectiviteToutesLesFichesUrl({
        collectiviteId,
        searchParams: `${nameToparams.planActionIds}=${planId}&${nameToparams.noTitre}=true`,
      }),
  },
  description: {
    title: 'Décrivez vos actions',
    subtitle: (count: number) =>
      `${count} ${pluralizeAction(count)} ${pluralizeVerb(
        count
      )} pas de description`,
    description:
      'Une description aide vos équipes à comprendre le contexte et les enjeux de chaque action.',
    buttonLabel: 'Ajouter des descriptions',
    getButtonLink: (collectiviteId, planId) =>
      makeCollectiviteToutesLesFichesUrl({
        collectiviteId,
        searchParams: `${nameToparams.planActionIds}=${planId}&${nameToparams.noDescription}=true`,
      }),
  },
  statut: {
    title: "Suivez l'avancement de vos actions",
    subtitle: (count: number) =>
      `${count} ${pluralizeAction(count)} ${pluralizeVerb(
        count
      )} pas de statut`,
    description:
      'Le statut permet de visualiser rapidement où en sont vos actions.',
    buttonLabel: 'Définir les statuts',
    getButtonLink: (collectiviteId, planId) =>
      makeCollectiviteToutesLesFichesUrl({
        collectiviteId,
        searchParams: `${nameToparams.planActionIds}=${planId}&${nameToparams.noStatut}=true`,
      }),
  },
  pilotes: {
    title: 'Responsabilisez vos équipes',
    subtitle: (count: number) =>
      `${count} ${pluralizeAction(count)} ${pluralizeVerb(
        count
      )} pas de pilote`,
    description:
      'Attribuer un pilote améliore le suivi et clarifie les responsabilités.',
    buttonLabel: 'Assigner des pilotes',
    getButtonLink: (collectiviteId, planId) =>
      makeCollectiviteToutesLesFichesUrl({
        collectiviteId,
        searchParams: `${nameToparams.planActionIds}=${planId}&${nameToparams.noPilote}=true`,
      }),
  },
  objectifs: {
    title: 'Définissez des objectifs',
    subtitle: (count: number) =>
      `${count} ${pluralizeAction(count)} ${pluralizeVerbEtre(
        count
      )} pas reliée${count > 1 ? 's' : ''} à un objectif`,
    description:
      'Lier une action à un objectif stratégique renforce la cohérence de votre plan.',
    buttonLabel: 'Associer des objectifs',
    getButtonLink: (collectiviteId, planId) =>
      makeCollectiviteToutesLesFichesUrl({
        collectiviteId,
        searchParams: `${nameToparams.planActionIds}=${planId}&${nameToparams.noObjectif}=true`,
      }),
  },
  indicateurs: {
    title: "Mesurez l'impact de vos actions",
    subtitle: (count: number) =>
      `${count} ${pluralizeAction(count)} ${pluralizeVerb(
        count
      )} pas d'indicateurs`,
    description:
      'Les indicateurs permettent de suivre concrètement les résultats obtenus.',
    buttonLabel: 'Ajouter des indicateurs',
    getButtonLink: (collectiviteId, planId) =>
      makeCollectiviteToutesLesFichesUrl({
        collectiviteId,
        searchParams: `${nameToparams.planActionIds}=${planId}&${nameToparams.hasIndicateurLies}=false`,
      }),
  },
  budgets: {
    title: 'Chiffrez vos moyens',
    subtitle: (count: number) =>
      `${count} ${pluralizeAction(count)} ${pluralizeVerb(
        count
      )} pas de budget renseigné`,
    description:
      "Indiquer les ressources (€ ou ETP) facilite l'arbitrage et le suivi financier.",
    buttonLabel: 'Renseigner les budgets',
    getButtonLink: (collectiviteId, planId) =>
      makeCollectiviteToutesLesFichesUrl({
        collectiviteId,
        searchParams: `${nameToparams.planActionIds}=${planId}&${nameToparams.hasBudget}=false`,
      }),
  },
  suiviRecent: {
    title: 'Actualisez le suivi de vos actions',
    subtitle: (count: number) =>
      `${count} ${pluralizeAction(count)} ${pluralizeVerb(
        count
      )} pas été mises à jour depuis 1 an`,
    description:
      'Un suivi régulier garantit que votre plan évolue efficacement et reste sous contrôle.',
    buttonLabel: 'Mettre à jour le suivi',
    getButtonLink: (collectiviteId, planId) =>
      makeCollectiviteToutesLesFichesUrl({
        collectiviteId,
        searchParams: `${nameToparams.planActionIds}=${planId}&${nameToparams.notesDeSuivi}=${WITHOUT_RECENT}`,
      }),
  },
};

const pluralizeAction = (count: number) => (count > 1 ? 'actions' : 'action');
const pluralizeVerb = (count: number) => (count > 1 ? "n'ont" : "n'a");
const pluralizeVerbEtre = (count: number) => (count > 1 ? 'ne sont' : "n'est");
