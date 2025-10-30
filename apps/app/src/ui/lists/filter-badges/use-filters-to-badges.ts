import { useQuery } from '@tanstack/react-query';

import { useCollectiviteId } from '@/api/collectivites';
import { filtreValuesFetch } from '@/api/collectivites/shared/data-access/filtre-values.fetch';
import {
  FiltreRessourceLiees,
  FiltreValues,
} from '@/api/collectivites/shared/domain/filtre-ressource-liees.schema';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { generateTitle } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/utils';
import { NOTES_DE_SUIVI_PROPERTIES } from '@/app/plans/fiches/list-all-fiches/filters/options';
import { getCategorieLabel } from '@/app/ui/dropdownLists/indicateur/utils';
import { ListDefinitionsInputFilters } from '@/domain/indicateurs';
import { ListFichesRequestFilters, NotesDeSuiviOption } from '@/domain/plans';

/**
 * Types de tous les filtres passables au hook `useFiltersToBadges`.
 *
 * Compléter les props si besoin de plus de filtres venant d'autres domaines.
 * Attention à ce que les nouveaux filtres soient compatibles avec ceux de `filtreValuesFetch`
 */
export type BadgeFilters = ListDefinitionsInputFilters &
  ListFichesRequestFilters;

/** Override les valeurs des badges retournées */
export type CustomFilterBadges = Partial<
  Record<keyof FinalFilters, string | undefined | false>
>;

// On exclut les filtres de ressources liées car ce sont uniquement des ids
// et on les remplace par les valeurs correspondantes de FiltreValues.
type FinalFilters = Omit<BadgeFilters, keyof FiltreRessourceLiees> &
  FiltreValues;

type Args = {
  filters: BadgeFilters;
  /** Permet d'override les valeurs des badges retournées */
  customValues?: CustomFilterBadges;
};

/** Transforme les filtres en string associées à afficher dans les badges. */
export const useFiltersToBadges = ({ filters, customValues }: Args) => {
  const collectiviteId = useCollectiviteId();
  const supabase = useSupabase();

  // On nettoie les valeurs vides de l'objet customValues.
  // Permet de ne pas avoir à le faire dans les composants utilisant le hook.
  customValues &&
    Object.entries(customValues).forEach(([key, value]) => {
      if (!value) {
        delete customValues[key as keyof CustomFilterBadges];
      }
    });

  return useQuery({
    queryKey: ['filter_badges', filters, customValues],
    queryFn: async () => {
      if (!collectiviteId) {
        throw new Error('Aucune collectivité associée');
      }

      /** Valeurs des filtres pour les champs où l'on ne connait que les ids */
      // Change this?
      const { data } = await filtreValuesFetch({
        dbClient: supabase,
        collectiviteId,
        filtre: filters,
      });

      // Merge les valeurs reçues avec les filtres donnés au hook
      // ex: planActions devient accessible après avoir récuper les valeurs depuis planActionIds.
      const mergedFilters: FinalFilters = { ...data, ...filters };

      // clés à retirer des valeurs données par défaut
      const overrideKeys = customValues && Object.keys(customValues);
      // On retire les clés des filtres à override afin de boucler et donner le texte par défaut correspondant à chaque type
      const mergedFiltersKeys = Object.keys(mergedFilters).filter(
        (key) => !overrideKeys?.includes(key)
      ) as Array<keyof FinalFilters>;

      // Initialisation du tableau des différents filtres sélectionnés retourné par le hook
      const badgeValues: string[] = [];

      // Pilotes et référents sont traités à part car ils peuvent provenir de plusieurs types (utilisateur, personne)
      const pilotes: string[] = [];
      const referents: string[] = [];

      // On boucle sur les clés afin de pouvoir donner le texte correspondant à chaque filtre
      mergedFiltersKeys.forEach((key) => {
        /** Communs */
        if (key === 'utilisateurPilotes') {
          const users = mergedFilters[key]?.map(
            (user) => `${user.prenom} ${user.nom}`
          );
          users && pilotes.push(...users);
        } else if (key === 'personnePilotes') {
          const personnes = mergedFilters[key]?.map((tag) => tag.nom);
          personnes && pilotes.push(...personnes);
        } else if (key === 'utilisateurReferents') {
          const users = mergedFilters[key]?.map(
            (user) => `${user.prenom} ${user.nom}`
          );
          users && referents.push(...users);
        } else if (key === 'personneReferentes') {
          const personnes = mergedFilters[key]?.map((tag) => tag.nom);
          personnes && referents.push(...personnes);
        } else if (key === 'servicePilotes') {
          badgeValues.push(
            `Direction ou service pilote : ${mergedFilters[key]
              ?.map((service) => service.nom)
              .join(', ')}`
          );
        } else if (key === 'libreTags') {
          badgeValues.push(
            `Tags personnalisés : ${mergedFilters[key]
              ?.map((i) => i.nom)
              .join(', ')}`
          );
        } else if (key === 'thematiques') {
          badgeValues.push(
            `Thématique : ${mergedFilters[key]
              ?.map((thematique) => thematique.nom)
              .join(', ')}`
          );
        } else if (key === 'financeurs') {
          badgeValues.push(
            `Financeur : ${mergedFilters[key]?.map((i) => i.nom).join(', ')}`
          );
        } else if (key === 'partenaires') {
          badgeValues.push(
            `Partenaire : ${mergedFilters[key]?.map((i) => i.nom).join(', ')}`
          );
        } else if (key === 'structurePilotes') {
          badgeValues.push(
            `Structure : ${mergedFilters[key]?.map((i) => i.nom).join(', ')}`
          );
        } else if (key === 'planActions') {
          badgeValues.push(
            `Plan d'action : ${mergedFilters[key]
              ?.map((plan) => generateTitle(plan.nom))
              .join(', ')}`
          );
        } else if (key === 'modifiedSince') {
          badgeValues.push(
            `Sur les ${mergedFilters[key]?.match(/\d+/)?.[0]} derniers jours`
          );

          /** Indicateurs */
        } else if (key === 'categorieNoms') {
          badgeValues.push(
            `Catégorie : ${mergedFilters[key]
              ?.map((nom) => getCategorieLabel(nom))
              .join(', ')}`
          );
        } else if (key === 'estRempli') {
          badgeValues.push(
            `Indicateur complété par la collectivité : ${
              mergedFilters[key] ? 'Complet' : 'Incomplet'
            }`
          );
        } else if (key === 'participationScore') {
          mergedFilters[key] && badgeValues.push('Participe au score CAE');
        } else if (key === 'estPerso') {
          mergedFilters[key] && badgeValues.push('Indicateur personnalisé');
        } else if (key === 'estConfidentiel') {
          mergedFilters[key] && badgeValues.push('Indicateur privé');
        } else if (key === 'hasOpenData') {
          mergedFilters[key] && badgeValues.push('Données Open Data');

          /** Fiches action */
        } else if (key === 'hasBudgetPrevisionnel') {
          mergedFilters[key] && badgeValues.push('Budget renseigné');
        } else if (key === 'restreint') {
          mergedFilters[key] && badgeValues.push('Confidentialité');
        } else if (key === 'hasIndicateurLies') {
          badgeValues.push(
            mergedFilters[key]
              ? 'Fiche avec indicateur(s) associé(s)'
              : 'Fiche sans indicateur(s) associé(s)'
          );
        } else if (key === 'hasMesuresLiees') {
          badgeValues.push(
            mergedFilters[key]
              ? 'Fiches avec mesure(s) des référentiels liée(s)'
              : 'Fiches sans mesure(s) des référentiels liée(s)'
          );
        } else if (key === 'hasDateDeFinPrevisionnelle') {
          badgeValues.push(
            mergedFilters[key]
              ? 'Date de fin prévisionnelle renseignée'
              : 'Date de fin prévisionnelle non renseignée'
          );
        } else if (key === 'notesDeSuivi') {
          badgeValues.push(
            NOTES_DE_SUIVI_PROPERTIES[mergedFilters[key] as NotesDeSuiviOption]
              .label
          );
        } else if (
          key === 'anneesNoteDeSuivi' &&
          mergedFilters[key] &&
          mergedFilters[key].length > 0
        ) {
          badgeValues.forEach((label, index) => {
            if (label === 'Avec note de suivi') {
              badgeValues[index] =
                'Avec note de suivi : ' + mergedFilters[key]?.sort().join(', ');
            }
          });
        } else if (key === 'ameliorationContinue') {
          mergedFilters[key] && badgeValues.push('Se répète tous les ans');
        } else if (key === 'priorites') {
          badgeValues.push(`Priorité : ${mergedFilters[key]?.join(', ')}`);
        } else if (key === 'statuts') {
          badgeValues.push(`Statut : ${mergedFilters[key]?.join(', ')}`);
        } else if (key === 'cibles') {
          badgeValues.push(`Cible : ${mergedFilters[key]?.join(', ')}`);
        } else if (key === 'noStatut') {
          mergedFilters[key] && badgeValues.push('Sans statut');
        } else if (key === 'noTag') {
          mergedFilters[key] && badgeValues.push('Sans tag personnalisés');
        } else if (key === 'noPilote') {
          mergedFilters[key] && badgeValues.push('Sans pilote');
        } else if (key === 'doesBelongToSeveralPlans') {
          mergedFilters[key] &&
            badgeValues.push('Actions mutualisées dans plusieurs plans');
        } else if (key === 'noPriorite') {
          mergedFilters[key] && badgeValues.push('Sans priorité');
        } else if (key === 'noServicePilote') {
          mergedFilters[key] &&
            badgeValues.push('Sans direction ou service pilote');
        } else if (key === 'noReferent') {
          mergedFilters[key] && badgeValues.push('Sans élu·e référent·e');
        } else if (
          key === 'typePeriode' &&
          mergedFilters[key] &&
          (mergedFilters.debutPeriode || mergedFilters.finPeriode)
        ) {
          badgeValues.push(
            typePeriodeToLabel[mergedFilters[key]] +
              ' ' +
              dateRangeToLabel(
                mergedFilters.debutPeriode,
                mergedFilters.finPeriode
              )
          );
        }
      });

      // Ajout des pilotes et réferents si présents
      if (pilotes.length > 0) {
        badgeValues.push(`Personne pilote : ${pilotes.join(', ')}`);
      }

      if (referents.length > 0) {
        badgeValues.push(`Élu·e référent·e : ${referents.join(', ')}`);
      }

      // On ajoute les valeurs à override si elles existent
      if (customValues) {
        Object.values(customValues).forEach((value) => {
          value && badgeValues.unshift(value);
        });
      }

      return badgeValues;
    },
  });
};

const typePeriodeToLabel = {
  modification: 'Modifiée',
  creation: 'Créée',
  debut: 'Commencée',
  fin: 'Terminée',
};

const dateRangeToLabel = (
  debut: string | undefined,
  fin: string | undefined
) => {
  if (debut && !fin) return `depuis le ${new Date(debut).toLocaleDateString()}`;
  if (!debut && fin) return `avant le ${new Date(fin).toLocaleDateString()}`;
  if (debut && fin)
    return `entre le ${new Date(debut).toLocaleDateString()} et le ${new Date(
      fin
    ).toLocaleDateString()}`;
  return '';
};
