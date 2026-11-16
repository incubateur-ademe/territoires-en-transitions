import type { ParentRow } from '@tet/backend/indicateurs/indicateurs/export-indicateurs/export-indicateurs.builder';
import type {
  PcaetDiagnostic,
  PcaetDiagnosticIndicateur,
} from '@tet/domain/demarches';
import type { IndicateurValeurAvecMetadonnesDefinition } from '@tet/domain/indicateurs';

type ConfigNode = {
  indicateurDefinitionId: string;
  children?: readonly ConfigNode[];
};

export type ExportIndicateursInput = {
  parents: ParentRow[];
  valeurs: IndicateurValeurAvecMetadonnesDefinition[];
};

/**
 * Met le diagnostic d'une démarche à la forme du builder de l'export
 * d'indicateurs.
 *
 * Le builder ne connaît que deux niveaux (parent, enfants) quand la config du
 * diagnostic en a trois (volet, ligne, sous-ligne). Chaque volet donne une
 * ligne parente portant ses lignes simples ; une ligne qui a ses propres
 * sous-lignes (un polluant et ses secteurs) devient à son tour un parent, placé
 * à la suite. L'ordre est celui des volets de la config, puis de leurs lignes.
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
  const getDefinition = (node: ConfigNode) =>
    definitionsParIdentifiant.get(node.indicateurDefinitionId);

  const parents: ParentRow[] = [];
  const dejaExportes = new Set<number>();

  const pushParent = (
    definition: PcaetDiagnosticIndicateur,
    enfants: PcaetDiagnosticIndicateur[]
  ) => {
    const enfantsInedits = enfants.filter(({ id }) => !dejaExportes.has(id));
    dejaExportes.add(definition.id);
    enfantsInedits.forEach(({ id }) => dejaExportes.add(id));
    parents.push({
      ...toRow(definition),
      pilotes: [],
      services: [],
      commentaire: null,
      unite: definition.unite,
      enfants: enfantsInedits.map(toRow),
    });
  };

  const pushGroupe = (node: ConfigNode) => {
    const definition = getDefinition(node);
    const enfants = (node.children ?? [])
      .filter((child) => !child.children?.length)
      .map(getDefinition)
      .filter((child) => child !== undefined);

    // Sans définition pour le volet, ses lignes simples s'exportent chacune
    // comme un parent : elles ne doivent pas disparaître de l'export.
    if (definition) {
      if (!dejaExportes.has(definition.id)) pushParent(definition, enfants);
    } else {
      enfants
        .filter(({ id }) => !dejaExportes.has(id))
        .forEach((enfant) => pushParent(enfant, []));
    }

    (node.children ?? [])
      .filter((child) => child.children?.length)
      .forEach(pushGroupe);
  };

  diagnostic.indicateurParentConfigs.forEach(pushGroupe);

  return {
    parents,
    valeurs: diagnostic.indicateurValeurs.map((valeur) => ({
      ...valeur,
      indicateurSourceMetadonnee: null,
    })),
  };
};

const toRow = (definition: PcaetDiagnosticIndicateur) => ({
  id: definition.id,
  identifiantReferentiel: definition.identifiantReferentiel,
  titre: definition.titre,
});
