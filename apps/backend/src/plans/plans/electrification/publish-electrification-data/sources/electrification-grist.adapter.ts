import { PublishedIndicateurReference } from '@tet/backend/indicateurs/indicateur/indicateur-reference-externe.repository';
import { ElectrificationConfig } from '@tet/domain/plans';
import { ElectrificationGristData } from './electrification-grist.schema';
import { ElectrificationGristEngagementsRules } from './electrification-grist-engagements.rules';

/** Le Grist fournit les contenus ; les correspondances TeT restent explicites. */
export class ElectrificationGristAdapter {
  static build({
    source,
    sourceUrl,
    indicateurReferences,
    engagementReferences,
    previousActions,
  }: {
    source: ElectrificationGristData;
    sourceUrl: string;
    indicateurReferences: PublishedIndicateurReference[];
    engagementReferences: PublishedIndicateurReference[];
    previousActions?: ElectrificationConfig['fiches']['actions'];
  }): Omit<ElectrificationConfig, 'version'> {
    const axes = this.index(source.Axes);
    const sousAxes = this.index(source.Sous_axes);
    const sousActions = this.index(source.Sous_actions);
    const indicateurs = this.index(source.Indicateurs);
    const ressources = this.index(source.Ressources);
    const previousActionsByCode = new Map(
      previousActions?.map((action) => [action.code, action])
    );
    const publishedIndicateurs = new Map(
      indicateurReferences.map((reference) => [
        reference.codeExterne,
        reference,
      ])
    );
    const previousSousActions = new Map(
      previousActions?.flatMap((action) =>
        action.sousActions.map(
          (sousAction) => [sousAction.code, sousAction] as const
        )
      )
    );
    const referencedSousActions = new Set<number>();

    const actions = source.Actions.map(({ id, fields: action }) => {
      const axe = this.reference(axes, action.Axe);
      const sousAxe = action.Sous_axe
        ? this.reference(sousAxes, action.Sous_axe)
        : null;
      if (sousAxe && sousAxe.Axe !== action.Axe)
        throw new Error('Axe et sous-axe incohérents');
      const previous = previousActionsByCode.get(action.Numero);
      return {
        code: action.Numero,
        validation: previous?.validation ?? ('validated' as const),
        axeNumero: axe.Numero,
        sousAxeNumero: sousAxe?.Numero ?? null,
        champs: {
          ...previous?.champs,
          titre: action.Titre,
          description: action.Descriptif?.trim() || null,
        },
        sousActions: [...action.Sous_actions]
          .sort(
            (a, b) =>
              this.reference(sousActions, a).Ordre -
              this.reference(sousActions, b).Ordre
          )
          .map((sourceId) => {
            const sousAction = this.reference(sousActions, sourceId);
            if (
              sousAction.Action !== id ||
              referencedSousActions.has(sourceId)
            ) {
              throw new Error('Rattachement de sous-action incohérent');
            }
            referencedSousActions.add(sourceId);
            // Identité indépendante du libellé, du parent et de l’ordre Grist.
            const code = `sous-action-${String(sourceId).padStart(3, '0')}`;
            const { description: _description, ...champs } =
              previousSousActions.get(code)?.champs ?? {};
            return {
              code,
              champs: {
                ...champs,
                titre: sousAction.Titre,
                ...(sousAction.Description
                  ? { description: sousAction.Description }
                  : {}),
              },
            };
          }),
        indicateurCodes: action.Indicateurs.map(
          (id) => this.reference(indicateurs, id).Code
        ),
        aides: action.Ressources.map((id) => {
          const resource = this.reference(ressources, id);
          return {
            titre: resource.Nom,
            url: resource.Site_web?.trim() || null,
          };
        }),
      };
    });
    if (referencedSousActions.size !== source.Sous_actions.length) {
      throw new Error('Sous-action sans rattachement dans le catalogue');
    }
    return {
      source: sourceUrl,
      engagements: this.buildEngagements(source.Axes, engagementReferences),
      axes: source.Axes.map(({ fields }) => ({
        numero: fields.Numero,
        titre: fields.Titre,
      })),
      sousAxes: source.Sous_axes.map(({ fields }) => ({
        numero: fields.Numero,
        titre: fields.Titre,
        axeNumero: this.reference(axes, fields.Axe).Numero,
      })),
      fiches: {
        actions,
        indicateurs: source.Indicateurs.map(({ fields }) => {
          const reference = publishedIndicateurs.get(fields.Code);
          return {
            code: fields.Code,
            type: 'quantitatif' as const,
            validation: reference?.identifiantReferentiel
              ? ('validated' as const)
              : ('pending' as const),
            identifiantReferentiel: reference?.identifiantReferentiel ?? null,
            unite: reference?.unite ?? null,
            periodicite: reference?.periodicite ?? null,
          };
        }),
      },
    };
  }

  private static buildEngagements(
    axes: ElectrificationGristData['Axes'],
    references: PublishedIndicateurReference[]
  ): ElectrificationConfig['engagements'] {
    const byCode = new Map(
      references.map((reference) => [reference.codeExterne, reference])
    );
    if (byCode.size !== references.length)
      throw new Error('Référence dupliquée');
    const engagements = ElectrificationGristEngagementsRules.read(axes);
    const usedReferences = new Set<string>();
    for (const engagement of engagements) {
      for (const cible of engagement.cibles) {
        const code = `${engagement.code}.${cible.key}`;
        const reference = byCode.get(code);
        if (!reference) continue;
        usedReferences.add(code);
        cible.identifiantReferentiel = reference.identifiantReferentiel;
        cible.unite = reference.unite;
        cible.periodicite = reference.periodicite;
        cible.validation = reference.identifiantReferentiel
          ? 'validated'
          : 'pending';
      }
    }
    if (usedReferences.size !== references.length) {
      throw new Error("Référence d'indicateur sans cible dans Grist");
    }
    return engagements;
  }

  private static index<T>(records: { id: number; fields: T }[]) {
    return new Map(records.map(({ id, fields }) => [id, fields]));
  }

  private static reference<T>(records: Map<number, T>, id: number): T {
    const value = records.get(id);
    if (!value) throw new Error(`Référence Grist absente : ${id}`);
    return value;
  }
}
