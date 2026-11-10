import {
  collectiviteTypeEnum,
  type CollectiviteType,
} from '../../../collectivites/collectivite-type.enum';

/**
 * Le mode démo raccourcit le parcours pour le présenter d'une traite : il
 * remplit les étapes, simule les avis et ne saisit aucun service réel.
 *
 * Double verrou : une collectivité de test ET un super admin. Un super admin
 * sur une vraie collectivité garde le parcours normal, et un membre ordinaire
 * d'une collectivité de test aussi.
 */
export const isDemarchePcaetDemo = ({
  collectiviteType,
  isSuperAdmin,
}: {
  collectiviteType: CollectiviteType | null | undefined;
  isSuperAdmin: boolean;
}): boolean => isSuperAdmin && collectiviteType === collectiviteTypeEnum.TEST;
