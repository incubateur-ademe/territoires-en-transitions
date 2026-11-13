/** La prévision du recalcul, en simulation seulement : le script refait l'addition de TeT, puisque le recalcul ne tourne pas. */

import { DEFAULT_ROUNDING_PRECISION } from '@tet/backend/indicateurs/valeurs/valeurs.constants';
import IndicateurExpressionService from '@tet/backend/indicateurs/valeurs/indicateur-expression.service';
import { round } from 'es-toolkit';
import { PoolClient } from 'pg';
import type { Dossiers } from './dossiers';
import { listDossiersMelanges, listTotauxRemplaces, toCle } from './recalcul';
import type { Valeur } from './tables-grille';

/** Simulation seulement (sans `--confirm`) : prévoit ce que le recalcul changera, en refaisant l'addition de TeT. */
export const prevoirRecalcul = async (
  client: PoolClient,
  dossiers: Dossiers,
  valeurs: readonly Valeur[]
) => {
  const formules = await loadFormules(client);
  const chiffres = new Map(
    valeurs.map((v) => [toCle(v, v.identifiant, v.champ), v.valeur])
  );
  return {
    totauxRecalcules: listTotauxRemplaces(valeurs, (v) =>
      calculate(
        v.identifiant,
        (id) => chiffres.get(toCle(v, id, v.champ)) ?? null,
        formules
      )
    ),
    dossiersMelanges: listDossiersMelanges(valeurs, dossiers),
  };
};

const expressions = new IndicateurExpressionService();

/** Les formules des indicateurs calculés et leur arrondi, lus en base. */
const loadFormules = async (client: PoolClient) => {
  const { rows } = await client.query<{
    identifiant: string;
    formule: string;
    precision: number | null;
  }>(
    `select identifiant_referentiel as identifiant, lower(valeur_calcule) as formule, precision
       from public.indicateur_definition
      where valeur_calcule is not null and identifiant_referentiel is not null`
  );
  return new Map(rows.map((r) => [r.identifiant, r]));
};

/** La valeur d'un indicateur comme TeT la calcule : formule évaluée par le backend, sous-totaux d'abord, arrondi à chaque étage. */
const calculate = (
  identifiant: string,
  getChiffre: (identifiant: string) => number | null,
  formules: Awaited<ReturnType<typeof loadFormules>>
): number | null => {
  const definition = formules.get(identifiant);
  if (!definition) {
    return getChiffre(identifiant);
  }
  const termes = expressions.extractNeededSourceIndicateursFromFormula(
    definition.formule
  );
  const somme = expressions.parseAndEvaluateExpression(
    definition.formule,
    Object.fromEntries(
      termes.map((t) => [
        t.identifiant,
        calculate(t.identifiant, getChiffre, formules),
      ])
    )
  );
  return somme === null
    ? null
    : round(somme, definition.precision ?? DEFAULT_ROUNDING_PRECISION);
};
