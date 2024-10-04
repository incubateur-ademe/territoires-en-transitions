import { Indicateurs } from '@tet/api';
import { FiltreValues } from '@tet/api/collectivites/shared/domain/filtre_ressource_liees.schema';
import { FiltreSpecifique as FiltreSpecifiqueFichesSynthse } from '@tet/api/plan-actions/dashboards/collectivite-dashboard/domain/fiches-synthese.schema';
import { FiltreSpecifique as FiltreSpecifiqueFicheActions } from '@tet/api/plan-actions/fiche-resumes.list/domain/fetch-options.schema';
import { ModuleDisplay } from '@tet/app/pages/collectivite/TableauDeBord/Module/Module';
import { DefaultButtonProps } from '@tet/ui';
import { generateTitle } from 'app/pages/collectivite/PlansActions/FicheAction/data/utils';
import { getCategorieLabel } from 'ui/dropdownLists/indicateur/utils';

type FiltreKeys = FiltreValues &
  Indicateurs.domain.FiltreSpecifique &
  FiltreSpecifiqueFicheActions &
  FiltreSpecifiqueFichesSynthse;

/** Converti les filtres sélectionnés en tableau de string
 * afin d'afficher les Badges correspondants aux filtres */
export const filtersToBadges = (data: FiltreKeys) => {
  const dataKeys = Object.keys(data || []) as Array<keyof FiltreKeys>;

  const badgeValues: string[] = [];

  const pilotes: string[] = [];
  const referents: string[] = [];

  dataKeys.forEach((key) => {
    if (key === 'utilisateurPilotes') {
      const users = data[key]?.map((user) => `${user.prenom} ${user.nom}`);
      users && pilotes.push(...users);
    } else if (key === 'personnePilotes') {
      const personnes = data[key]?.map((tag) => tag.nom);
      personnes && pilotes.push(...personnes);
    } else if (key === 'utilisateurReferents') {
      const users = data[key]?.map((user) => `${user.prenom} ${user.nom}`);
      users && referents.push(...users);
    } else if (key === 'personneReferentes') {
      const personnes = data[key]?.map((tag) => tag.nom);
      personnes && referents.push(...personnes);
    } else if (key === 'thematiques') {
      badgeValues.push(
        `Thématique : ${data[key]
          ?.map((thematique) => thematique.nom)
          .join(', ')}`
      );
    } else if (key === 'categorieNoms') {
      badgeValues.push(
        `Catégorie : ${data[key]
          ?.map((nom) => getCategorieLabel(nom))
          .join(', ')}`
      );
    } else if (key === 'planActions') {
      badgeValues.push(
        `Plan d'action : ${data[key]
          ?.map((plan) => generateTitle(plan.nom))
          .join(', ')}`
      );
    } else if (key === 'estComplet') {
      badgeValues.push(`Complétion : ${data[key] ? 'Complet' : 'Incomplet'}`);
    } else if (key === 'participationScore') {
      data[key] && badgeValues.push('Participe au score CAE');
    } else if (key === 'estPerso') {
      data[key] && badgeValues.push('Indicateur personnalisé');
    } else if (key === 'estConfidentiel') {
      data[key] && badgeValues.push('Indicateur privé');
    } else if (key === 'budgetPrevisionnel') {
      data[key] && badgeValues.push('Budget renseigné');
    } else if (key === 'restreint') {
      data[key] && badgeValues.push('Confidentialité');
    } else if (key === 'hasOpenData') {
      data[key] && badgeValues.push('Données Open Data');
    } else if (key === 'hasIndicateurLies') {
      data[key] && badgeValues.push('Indicateur(s) lié(s)');
    } else if (key === 'ameliorationContinue') {
      data[key] && badgeValues.push('Se répète tous les ans');
    } else if (key === 'priorites') {
      badgeValues.push(`Priorité : ${data[key]?.join(', ')}`);
    } else if (key === 'statuts') {
      badgeValues.push(`Statut : ${data[key]?.join(', ')}`);
    } else if (key === 'servicePilotes') {
      badgeValues.push(
        `Direction ou service pilote : ${data[key]
          ?.map((service) => service.nom)
          .join(', ')}`
      );
    } else if (key === 'financeurs') {
      badgeValues.push(
        `Financeur : ${data[key]?.map((i) => i.nom).join(', ')}`
      );
    } else if (key === 'partenaires') {
      badgeValues.push(
        `Partenaire : ${data[key]?.map((i) => i.nom).join(', ')}`
      );
    } else if (key === 'structurePilotes') {
      badgeValues.push(
        `Structure : ${data[key]?.map((i) => i.nom).join(', ')}`
      );
    } else if (key === 'cibles') {
      badgeValues.push(`Cible : ${data[key]?.join(', ')}`);
    } else if (key === 'dateDebut') {
      badgeValues.push(`Date de début : ${data[key]}`);
    } else if (key === 'dateFin') {
      badgeValues.push(`Date de fin prévisionnelle : ${data[key]}`);
    } else if (key === 'modifiedSince') {
      badgeValues.push(
        `Sur les ${data[key]?.match(/\d+/)?.[0]} derniers jours`
      );
    }
  });

  if (pilotes.length > 0) {
    badgeValues.push(`Personne pilote : ${pilotes.join(', ')}`);
  }

  if (referents.length > 0) {
    badgeValues.push(`Élu·e référent·e : ${referents.join(', ')}`);
  }

  return badgeValues;
};

type DisplayOption = Omit<DefaultButtonProps, 'id'> & {
  id: ModuleDisplay;
};

/** Associe les options demandées aux props des boutons de ButtonGroup */
export const getDisplayButtons = ({
  moduleOptions,
  onClick,
  texts,
}: {
  moduleOptions?: DisplayOption[];
  onClick: (display: ModuleDisplay) => void;
  texts?: Partial<Record<ModuleDisplay, string | undefined>>;
}) => {
  const displayOptions: DisplayOption[] = [
    {
      id: 'circular',
      icon: 'pie-chart-2-line',
      onClick: () => onClick('circular'),
      children: texts?.circular,
    },
    {
      id: 'row',
      icon: 'layout-grid-line',
      onClick: () => onClick('row'),
      children: texts?.row,
    },
  ];
  return moduleOptions
    ? displayOptions.filter((o) => moduleOptions.some((opt) => opt.id === o.id))
    : displayOptions;
};
