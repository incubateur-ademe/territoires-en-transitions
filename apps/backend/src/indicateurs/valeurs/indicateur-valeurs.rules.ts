import { BadRequestException } from '@nestjs/common';
import {
  Indicateur,
  IndicateurPeriodiciteEnum,
  IndicateurPeriodes,
  IndicateurValeurCreate,
} from '@tet/domain/indicateurs';
import { isNil, round } from 'es-toolkit';

/** Identité et normalisation communes aux écritures et aux calculs. */
export class IndicateurValeursRules {
  static getIdentity(
    valeur: Pick<
      IndicateurValeurCreate,
      | 'collectiviteId'
      | 'indicateurId'
      | 'periodicite'
      | 'dateValeur'
      | 'metadonneeId'
    >
  ): string {
    return `${valeur.collectiviteId}:${valeur.indicateurId}:${
      valeur.periodicite
    }:${valeur.dateValeur}:${valeur.metadonneeId ?? 'collectivite'}`;
  }

  static normalize(
    valeur: IndicateurValeurCreate,
    indicateur: Pick<Indicateur, 'id' | 'precision'>
  ): IndicateurValeurCreate {
    const periodicite =
      valeur.periodicite ?? IndicateurPeriodiciteEnum.ANNUELLE;
    return {
      ...valeur,
      periodicite,
      dateValeur: this.getCanonicalDateValeur(valeur.dateValeur, {
        id: indicateur.id,
        periodicite,
      }),
      resultat: !isNil(valeur.resultat)
        ? round(valeur.resultat, indicateur.precision)
        : null,
      objectif: !isNil(valeur.objectif)
        ? round(valeur.objectif, indicateur.precision)
        : null,
    };
  }

  static getCanonicalDateValeur(
    dateValeur: string,
    indicateur: Pick<Indicateur, 'id' | 'periodicite'>
  ): string {
    try {
      // L'API annuelle accepte une date dans l'année ; le stockage utilise son premier jour.
      const periode =
        indicateur.periodicite === IndicateurPeriodiciteEnum.ANNUELLE
          ? IndicateurPeriodes.containing(indicateur.periodicite, dateValeur)
          : IndicateurPeriodes.fromDateValeur(
              indicateur.periodicite,
              dateValeur
            );
      return IndicateurPeriodes.toDateValeur(periode);
    } catch {
      throw new BadRequestException(
        `Date de valeur ${dateValeur} non canonique pour l'indicateur ${indicateur.id} (${indicateur.periodicite})`
      );
    }
  }
}
