import {
  CollectiviteType,
  collectiviteTypeEnum,
} from './collectivite-type.enum';

/**
 * Les collectivités qui n'existent **que** pour instruire : pas de territoire
 * propre, pas de plans, pas de référentiels — leur seul espace est celui de
 * l'instruction, et les routes standard les renvoient vers lui.
 *
 * Le nom dit « déconcentré » par héritage : un service national n'en est pas
 * un, mais relève du même régime.
 *
 * À ne pas confondre avec `isTypeInstructeur` (`@tet/domain/demarches`), qui dit
 * qui *voit* les dossiers transmis. Un conseil régional est instructeur sans
 * être un service déconcentré : il consulte les dossiers de sa région **et**
 * garde son propre espace de collectivité. L'inscrire ici lui ferait perdre ses
 * plans et ses référentiels.
 */
export const servicesDeconcentresTypes: readonly CollectiviteType[] = [
  collectiviteTypeEnum.DREAL,
  collectiviteTypeEnum.DDT,
  collectiviteTypeEnum.DR_ADEME,
  collectiviteTypeEnum.SERVICE_NATIONAL,
];

export const isServiceDeconcentre = (type: CollectiviteType): boolean =>
  servicesDeconcentresTypes.includes(type);
