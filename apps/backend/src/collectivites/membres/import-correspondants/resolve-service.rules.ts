import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  CollectiviteType,
  collectiviteTypeEnum,
} from '@tet/domain/collectivites';
import { CorrespondantCsv } from './correspondant-csv.schema';

/**
 * Ce qui identifie un service dans sa famille.
 *
 * Reprend les index uniques que la base porte déjà : une DREAL et une DR ADEME
 * par région, une DDT par département. Un service national n'a aucun code
 * géographique — c'est ce qui fait son périmètre — donc son établissement le
 * distingue : la DGEC et l'ADEME nationale sont deux lignes du même type.
 *
 * Ajouter une famille, c'est ajouter une ligne ici.
 */
export const cleAppariementParType = {
  [collectiviteTypeEnum.DREAL]: 'region_code',
  [collectiviteTypeEnum.DR_ADEME]: 'region_code',
  [collectiviteTypeEnum.REGION]: 'region_code',
  [collectiviteTypeEnum.DDT]: 'departement_code',
  [collectiviteTypeEnum.SERVICE_NATIONAL]: 'siret',
} as const;

export type TypeCorrespondant = keyof typeof cleAppariementParType;
export type ColonneCle = (typeof cleAppariementParType)[TypeCorrespondant];

export type CleAppariement = { colonne: ColonneCle; valeur: string };

const COLONNES_CLE: readonly ColonneCle[] = [
  'region_code',
  'departement_code',
  'siret',
];

export const estTypeCorrespondant = (
  type: CollectiviteType
): type is TypeCorrespondant => type in cleAppariementParType;

/**
 * La clé d'appariement d'une ligne, ou le motif qui la rend inexploitable.
 *
 * Une ligne qui renseigne une autre colonne que celle de son type est refusée
 * plutôt que devinée : sur une campagne qui n'écrit qu'une fois, un fichier
 * ambigu doit s'arrêter.
 */
export function extraireCleAppariement(
  ligne: CorrespondantCsv
): Result<CleAppariement, string> {
  if (!estTypeCorrespondant(ligne.type)) {
    return failure(
      `le type « ${ligne.type} » n'est pas un service à correspondants`
    );
  }

  const attendue = cleAppariementParType[ligne.type];
  const valeur = ligne[attendue];

  if (!valeur) {
    return failure(`le type « ${ligne.type} » exige la colonne ${attendue}`);
  }

  const parasites = COLONNES_CLE.filter(
    (colonne) => colonne !== attendue && ligne[colonne]
  );
  if (parasites.length) {
    return failure(
      `le type « ${ligne.type} » s'apparie par ${attendue} : ${parasites.join(
        ', '
      )} ne doit pas être renseigné`
    );
  }

  if (attendue === 'siret' && !/^\d{14}$/.test(valeur)) {
    return failure(`le SIRET « ${valeur} » doit compter 14 chiffres`);
  }

  return success({ colonne: attendue, valeur });
}

/** Un SIRET est un SIREN (9) suivi d'un NIC (5), les deux colonnes de `collectivite`. */
export const decouperSiret = (siret: string) => ({
  siren: siret.slice(0, 9),
  nic: siret.slice(9),
});
