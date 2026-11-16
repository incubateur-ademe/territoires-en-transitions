import type { ParentRow } from '@tet/backend/indicateurs/indicateurs/export-indicateurs/export-indicateurs.builder';
import {
  buildPcaetDiagnosticIndicateurTables,
  type PcaetDiagnostic,
  type PcaetDiagnosticIndicateurParentConfig,
  type PcaetDiagnosticIndicateurTableLayout,
  type PcaetDiagnosticIndicateurTableRow,
} from '@tet/domain/demarches';
import type { IndicateurValeurAvecMetadonnesDefinition } from '@tet/domain/indicateurs';

export type ExportIndicateursInput = {
  parents: ParentRow[];
  valeurs: IndicateurValeurAvecMetadonnesDefinition[];
};

const CATEGORIE_SEPARATOR = ' – ';

/**
 * Met le diagnostic d'une démarche à la forme du builder de l'export
 * d'indicateurs, en suivant ce que montre l'écran.
 *
 * Une ligne par ligne saisissable, dans l'ordre des tables de l'écran
 * (`buildPcaetDiagnosticIndicateurTables`), sous le libellé qu'elle y porte.
 * Chaque ligne a pour `categorie` les titres sous lesquels l'écran la range :
 * volet, section, table.
 *
 * Les agrégats (indicateur du volet, indicateur d'un polluant) ne sont pas des
 * lignes de l'écran : ils ne sont pas exportés, leurs éventuelles valeurs non
 * plus.
 *
 * Un indicateur déclaré non applicable par la collectivité le dit dans son
 * libellé : sa ligne vide ne se confond pas avec une saisie manquante. Ses
 * éventuelles valeurs, saisies avant la déclaration, ne sont pas exportées.
 *
 * Toutes les valeurs du diagnostic portent la source `pcaet-collectivite` :
 * elles sont la saisie de la collectivité. Leur métadonnée de source est
 * retirée, sans quoi le builder les rangerait sur une ligne « source » et
 * laisserait vide la ligne principale.
 */
export const toExportIndicateurs = (
  diagnostic: PcaetDiagnostic
): ExportIndicateursInput => {
  const definitionsParIdentifiant = new Map(
    diagnostic.indicateurDefinitions.map((definition) => [
      definition.identifiantReferentiel,
      definition,
    ])
  );
  const parents: ParentRow[] = [];
  const exportes = new Set<number>();
  const nonApplicables = new Set<number>();

  const pushLigne = (
    { indicateurDefinitionId, label }: PcaetDiagnosticIndicateurTableRow,
    categorie: string
  ) => {
    const definition = definitionsParIdentifiant.get(indicateurDefinitionId);
    if (!definition || exportes.has(definition.id)) return;

    exportes.add(definition.id);
    if (definition.isApplicable === false) nonApplicables.add(definition.id);
    parents.push({
      id: definition.id,
      identifiantReferentiel: definition.identifiantReferentiel,
      titre:
        definition.isApplicable === false ? `${label} (non applicable)` : label,
      unite: definition.unite,
      categorie,
      pilotes: [],
      services: [],
      commentaire: null,
      enfants: [],
    });
  };

  for (const config of diagnostic.indicateurParentConfigs) {
    for (const table of buildPcaetDiagnosticIndicateurTables(config)) {
      const categorie = toCategorie(config, table);
      table.rows.forEach((row) => pushLigne(row, categorie));
    }
  }

  return {
    parents,
    valeurs: diagnostic.indicateurValeurs
      .filter(
        ({ indicateurDefinition }) =>
          indicateurDefinition &&
          exportes.has(indicateurDefinition.id) &&
          !nonApplicables.has(indicateurDefinition.id)
      )
      .map((valeur) => ({ ...valeur, indicateurSourceMetadonnee: null })),
  };
};

/** Titres de l'écran au-dessus d'une table : volet, section, table. */
const toCategorie = (
  config: PcaetDiagnosticIndicateurParentConfig,
  table: PcaetDiagnosticIndicateurTableLayout
) =>
  [config.label, table.section, table.title]
    .filter((titre) => titre !== null)
    // Un volet à table unique donne son nom à sa table : pas de doublon.
    .filter((titre, index, titres) => titre !== titres[index - 1])
    .join(CATEGORIE_SEPARATOR);
