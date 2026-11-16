import type {
  PcaetDiagnostic,
  PcaetDiagnosticIndicateurTableLayout,
} from '@tet/domain/demarches';

/** Configuration de table enrichie des définitions et valeurs du diagnostic. */
export type DiagnosticIndicateurTable = PcaetDiagnosticIndicateurTableLayout & {
  indicateurDefinitions: PcaetDiagnostic['indicateurDefinitions'];
  indicateurValeurs: PcaetDiagnostic['indicateurValeurs'];
};

const identifiantsInTable = (
  table: PcaetDiagnosticIndicateurTableLayout
): Set<string> => new Set(table.rows.map((row) => row.indicateurDefinitionId));

const attachIndicateurDataToTable = (
  table: PcaetDiagnosticIndicateurTableLayout,
  {
    indicateurs,
    valeurs,
  }: {
    indicateurs: PcaetDiagnostic['indicateurDefinitions'];
    valeurs: PcaetDiagnostic['indicateurValeurs'];
  }
): DiagnosticIndicateurTable => {
  const identifiants = identifiantsInTable(table);
  return {
    ...table,
    indicateurDefinitions: indicateurs.filter((indicateur) => {
      const identifiant = indicateur.identifiantReferentiel;
      return (
        identifiant !== null &&
        identifiant !== undefined &&
        identifiants.has(identifiant)
      );
    }),
    indicateurValeurs: valeurs.filter(({ indicateurDefinition }) => {
      const identifiant = indicateurDefinition?.identifiantReferentiel;
      return (
        identifiant !== null &&
        identifiant !== undefined &&
        identifiants.has(identifiant)
      );
    }),
  };
};

export const attachIndicateurDataToTables = (
  tables: PcaetDiagnosticIndicateurTableLayout[],
  data: {
    indicateurs: PcaetDiagnostic['indicateurDefinitions'];
    valeurs: PcaetDiagnostic['indicateurValeurs'];
  }
): DiagnosticIndicateurTable[] =>
  tables.map((table) => attachIndicateurDataToTable(table, data));
