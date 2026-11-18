import type { ElectrificationConfig } from '@tet/domain/plans';
import type { ElectrificationGristData } from './electrification-grist.schema';

type Engagement = ElectrificationConfig['engagements'][number];
type Cible = Engagement['cibles'][number];

/** Contrat de lecture de Code_signe et Parametre_signe, indépendant des codes métier. */
export class ElectrificationGristEngagementsRules {
  static read(axes: ElectrificationGristData['Axes']): Engagement[] {
    const seen = new Set<string>();
    const engagements = axes.flatMap(({ fields: axe }) => {
      const codes = axe.Code_signe.split('+').map((code) => code.trim());
      for (const code of codes) {
        if (!/^[\p{L}\p{N}_-]+$/u.test(code) || seen.has(code)) {
          throw new Error('Code Grist vide, invalide ou dupliqué');
        }
        seen.add(code);
      }
      const labels = this.splitLabels(axe.Parametre_signe, codes);
      return [...labels].map(([code, libelleSource]) => {
        const cibles = this.readCibles(libelleSource);
        return {
          code,
          axeNumero: axe.Numero,
          libelleSource,
          actionTitre: cibles.length
            ? null
            : /_{2,}/u.test(libelleSource)
            ? axe.Titre
            : libelleSource.replace(/\s*\(non chiffré\)\s*$/iu, '').trim(),
          cibles,
        };
      });
    });
    if (!engagements.length) throw new Error('Aucun engagement Grist');
    return engagements.sort((a, b) => a.code.localeCompare(b.code));
  }

  private static splitLabels(
    text: string,
    codes: string[]
  ): Map<string, string> {
    const annotations = [...text.matchAll(/\(([\p{L}\p{N}_-]+)\)/gu)];
    if (codes.length === 1 && !annotations.length) {
      return new Map([[codes[0], text]]);
    }
    // Les objectifs regroupés partagent le préfixe (verbe et échéance) ;
    // chaque blanc doit être suivi de son code explicite, jamais associé par position.
    const firstBlank = text.search(/_{2,}/u);
    const prefix = text.slice(0, firstBlank);
    const parts = [...text.matchAll(/(_{2,}[^_]*?)\(([\p{L}\p{N}_-]+)\)/gu)];
    if (
      firstBlank < 0 ||
      annotations.length !== codes.length ||
      parts.length !== codes.length ||
      new Set(parts.map((part) => part[2])).size !== codes.length ||
      parts.some((part) => !codes.includes(part[2])) ||
      text
        .slice(firstBlank)
        .replace(/_{2,}[^_]*?\([\p{L}\p{N}_-]+\)/gu, '')
        .replace(/\bet\b|[\s,;]/gu, '')
    ) {
      throw new Error(
        'Engagements Grist regroupés sans rattachement explicite'
      );
    }
    return new Map(
      parts.map((part) => [part[2], `${prefix}${part[1].trim()}`])
    );
  }

  private static readCibles(label: string): Cible[] {
    const text = label.normalize('NFKC').replace(/[’‘]/gu, "'");
    const blanks = [...text.matchAll(/_{2,}/gu)];
    const dates = [...text.matchAll(/\b(?:d'ici|en)\s+(\d{4})\b/giu)];
    const years = [...text.matchAll(/\b\d{4}\b/gu)];
    if (dates.length > 1 || years.length !== dates.length) {
      throw new Error("Échéance annuelle de l'engagement Grist ambiguë");
    }
    // Une action non datée ne crée pas d'objectif annuel. Son texte reste
    // disponible pour le rapprochement avec le Word et sa fiche est conservée.
    if (!dates.length || !blanks.length) {
      if (/\bd'ici\b/iu.test(text) && !dates.length) {
        throw new Error('Échéance Grist non reconnue');
      }
      return [];
    }
    const year = Number(dates[0][1]);
    const quantities = text.replace(dates[0][0], '').split(/_{2,}/u).slice(1);
    const included =
      quantities.length === 2 && /\bdont\s*$/iu.test(quantities[0]);
    if (quantities.length !== 1 && !included) {
      throw new Error('Relation entre les cibles Grist non reconnue');
    }
    const descriptions = quantities.map((part) =>
      part
        .replace(/\s*,?\s*dont\s*$/iu, '')
        .replace(/[\s.,;]+$/u, '')
        .trim()
    );
    const unit = descriptions[0].match(/^(%|[\p{L}]+)(?:\s|$)/u)?.[1];
    if (!unit || descriptions.some((description) => !description)) {
      throw new Error('Unité ou libellé de cible Grist absent');
    }
    if (included) {
      const child = descriptions[1];
      const qualifier = child.startsWith(`${unit} `)
        ? child.slice(unit.length).trim()
        : child;
      // Un qualificatif simple hérite de l'unité du total. Une autre unité
      // explicite ("% rapides", "kW rapides"...) ne décrit pas un sous-ensemble.
      if (
        !/^(?:\p{Lu}?\p{Ll}+|\p{Lu}+)(?:-(?:\p{Ll}+|\p{Lu}+))*$/u.test(
          qualifier
        )
      ) {
        throw new Error('Unité ou qualificatif de sous-cible Grist ambigu');
      }
    }
    return descriptions.map((description, index) => {
      const key = !included
        ? 'principale'
        : index === 0
        ? 'total'
        : this.key(description);
      if (!key || (included && index > 0 && key === 'total')) {
        throw new Error('Identité de cible Grist ambiguë');
      }
      const qualifier = description.match(/([\p{L}]+)$/u)?.[1];
      const labels = included
        ? [
            ...new Set([
              key,
              description,
              ...(qualifier ? this.variants(qualifier) : []),
            ]),
          ]
        : [];
      return {
        key,
        libelleSource: description,
        uniteImport: unit,
        reglesImport: {
          annee: year,
          minimum: 0,
          maximum: unit === '%' ? 100 : null,
          plafondCible: included && index > 0 ? 'total' : null,
          libelles: labels,
          unites: this.variants(unit),
        },
        identifiantReferentiel: null,
        unite: null,
        periodicite: null,
        validation: 'pending',
      };
    });
  }

  private static key(label: string): string {
    return label
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/gu, '-')
      .replace(/^-|-$/gu, '');
  }

  private static variants(word: string): string[] {
    // La casse d'un symbole physique reste significative (MWh != mWh).
    if (!/^[\p{Ll}]{3,}$/u.test(word)) return [word];
    const words =
      word.endsWith('s') && !word.endsWith('ss')
        ? [word, word.slice(0, -1)]
        : [word];
    return words.flatMap((value) => [
      value,
      value[0].toUpperCase() + value.slice(1),
      value.toUpperCase(),
    ]);
  }
}
