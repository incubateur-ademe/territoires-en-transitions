import { PublishedIndicateurReference } from '@tet/backend/indicateurs/indicateur/indicateur-reference-externe.repository';
import {
  ElectrificationConfig,
  ElectrificationEngagementCodeEnum as EngagementCode,
} from '@tet/domain/plans';
import { electrificationDocumentTemplate } from '../../config/electrification-document-template.constants';
import { ElectrificationGristData } from './electrification-grist.schema';

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
    const knownCodes = new Set<string>(Object.values(EngagementCode));
    const seenCodes = new Set<string>();
    const targetCodes = new Set<string>();
    const byCode = new Map(
      references.map((reference) => [reference.codeExterne, reference])
    );
    const { actionCodes, targetKeys } =
      electrificationDocumentTemplate.engagements;
    const engagements = axes.flatMap(({ fields: axe }) =>
      axe.Code_signe.split('+').map((value) => {
        const code = value.trim();
        if (!knownCodes.has(code) || seenCodes.has(code)) {
          throw new Error('Code d’engagement inconnu ou dupliqué dans Grist');
        }
        seenCodes.add(code);
        const keys = actionCodes.some((actionCode) => actionCode === code)
          ? []
          : code === EngagementCode.BORNES_RECHARGE_PUBLIQUES
          ? targetKeys.recharge
          : targetKeys.single;
        return {
          code,
          axeNumero: axe.Numero,
          actionTitre: keys.length ? null : this.getActionTitre(axe),
          cibles: keys.map((key) => {
            const externalCode = `${code}.${key}`;
            targetCodes.add(externalCode);
            const reference = byCode.get(externalCode);
            return {
              key,
              identifiantReferentiel: reference?.identifiantReferentiel ?? null,
              unite: reference?.unite ?? null,
              periodicite: reference?.periodicite ?? null,
              validation: reference?.identifiantReferentiel
                ? ('validated' as const)
                : ('pending' as const),
            };
          }),
        };
      })
    );
    if (
      seenCodes.size !== knownCodes.size ||
      references.some(({ codeExterne }) => !targetCodes.has(codeExterne))
    ) {
      throw new Error('Engagement manquant ou référence de cible inconnue');
    }
    return engagements.sort((a, b) => a.code.localeCompare(b.code));
  }

  private static getActionTitre(
    axe: ElectrificationGristData['Axes'][number]['fields']
  ) {
    // Les champs à remplir ne deviennent pas un titre d’action ni une quantité inventée.
    return /_{2,}/.test(axe.Parametre_signe)
      ? axe.Titre
      : axe.Parametre_signe.replace(/\s*\(non chiffré\)\s*$/i, '').trim();
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
