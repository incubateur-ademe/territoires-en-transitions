import {
  ajouterCollectiviteUrl,
  bannerInfoUrl,
  importerPlanUrl,
  makeCollectiviteActionsDeReferenceUrl,
  makeCollectiviteAffichageReferentielsUrl,
  makeCollectiviteModifierUrl,
  makeDemandesAvisUrl,
} from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import {
  canReadPriorisation,
  getReferentielDisplayMap,
} from '@tet/domain/collectivites';
import { isTypeInstructeur } from '@tet/domain/demarches';
import { hasRole, isUserVisitor, PlatformRole } from '@tet/domain/users';
import { isNavDropdown, NavItem, NavLink } from '@tet/ui';
import { generateCollectiviteNavItem } from './generate-collectivite-nav-item';
import { generateEdlDropdown } from './generate-edl-dropdown';
import { generateIndicateursDropdown } from './generate-indicateurs-dropdown';
import { generatePriorisationLink } from './generate-priorisation-link';
import { generatePlansActionsDropdown } from './generate-plans-actions-dropdown';
import { generateTdbLink } from './generate-tdb-dropdown';

import type {
  CollectiviteNavItem,
  MakeCollectiviteNav,
} from './make-collectivite-nav.contract';

export const cleanButtonProps = (item: CollectiviteNavItem): NavItem => {
  const { isVisible, ...rest } = item;
  return rest;
};

export const filterNavItems = (
  items: (CollectiviteNavItem | null)[]
): NavItem[] =>
  items
    .filter((item) => item !== null)
    .filter((item) => (item.isVisible !== undefined ? item.isVisible : true))
    .map((item) =>
      isNavDropdown(item)
        ? { ...item, links: filterNavItems(item.links) as NavLink[] }
        : { ...item }
    )
    .map(cleanButtonProps);

export const makeCollectiviteNav: MakeCollectiviteNav = ({
  user,
  currentCollectivite,
  isDemarchePcaetEnabled,
  isPriorisationEnabled,
}) => {
  const { collectiviteId, collectiviteAccesRestreint } = currentCollectivite;
  const isVisitor = isUserVisitor(user, { collectiviteId });
  const isSuperAdmin = hasRole(user, PlatformRole.SUPER_ADMIN);
  /**
   * Membre de cette collectivité, au sens strict du layout d'instruction — un
   * super-admin qui n'en est pas membre n'y accède pas davantage, la nav ne doit
   * donc pas le lui proposer.
   */
  const estMembreCollectivite = user.collectivites.some(
    (acces) => acces.collectiviteId === collectiviteId
  );

  const startItems: (CollectiviteNavItem | null)[] = [
    generateTdbLink({
      user,
      collectiviteId,
      collectiviteAccesRestreint,
      isVisitor,
    }),
    generatePlansActionsDropdown({
      collectiviteId,
      collectiviteAccesRestreint,
      isVisitor,
    }),
    generateIndicateursDropdown({
      collectiviteId,
      collectiviteAccesRestreint,
      isVisitor,
    }),
    generateEdlDropdown({
      collectiviteId,
      collectiviteAccesRestreint,
      isVisitor,
      referentielsDisplay: getReferentielDisplayMap(
        currentCollectivite.collectivitePreferences.referentiels
      ),
      // `mode` par référentiel : sert à suffixer "(archivé)" dans la nav.
      referentielsPreferences:
        currentCollectivite.collectivitePreferences.referentiels,
      isDemarchePcaetEnabled,
    }),
    generatePriorisationLink({
      collectiviteId,
      canReadPriorisation: canReadPriorisation(user, {
        collectiviteId,
        collectiviteType: currentCollectivite.collectiviteType,
        collectiviteAccesRestreint,
      }),
      isPriorisationEnabled,
    }),
    {
      // Une collectivité qui instruit sans être un service déconcentré — le
      // conseil régional — garde cette nav et atteint l'instruction par ici.
      // Une DREAL ou une DDT n'a pas cette nav du tout.
      //
      // L'appartenance est reprise telle quelle du layout d'instruction, qui
      // refuse les non-membres : le type de collectivité ne suffit pas, sinon le
      // lien mènerait un visiteur droit sur une page d'erreur.
      isVisible:
        estMembreCollectivite &&
        isTypeInstructeur(currentCollectivite.collectiviteType),
      children: appLabels.instructionTitre,
      href: makeDemandesAvisUrl({ collectiviteId }),
    },
    {
      isVisible: isSuperAdmin,
      children: appLabels.roleSuperAdmin,
      links: [
        {
          children: appLabels.importerUnPlan,
          href: importerPlanUrl,
        },
        {
          children: appLabels.ajouterCollectivite,
          href: ajouterCollectiviteUrl,
        },
        {
          children: appLabels.modifierCollectivite,
          href: makeCollectiviteModifierUrl({
            collectiviteId,
          }),
        },
        {
          children: appLabels.affichageDesReferentiels,
          href: makeCollectiviteAffichageReferentielsUrl({
            collectiviteId,
          }),
        },
        {
          children: 'Bannière',
          href: bannerInfoUrl,
        },
        {
          children: appLabels.actionsDeReference,
          href: makeCollectiviteActionsDeReferenceUrl({ collectiviteId }),
        },
      ],
    },
  ];

  const endItems: CollectiviteNavItem[] = [
    generateCollectiviteNavItem({
      user,
      currentCollectivite,
    }),
  ];

  return {
    startItems: filterNavItems(startItems),
    endItems: filterNavItems(endItems),
  };
};
