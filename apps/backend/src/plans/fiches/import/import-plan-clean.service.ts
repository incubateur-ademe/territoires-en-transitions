import { TagEnum, TagType } from '@/backend/collectivites/tags/tag.table-base';
import {
  PersonneImport,
  TagImport,
} from '@/backend/plans/fiches/import/import-plan.dto';
import {
  Cible,
  ParticipationCitoyenne,
  Priorite,
  Statut,
  ciblesEnumValues,
  participationCitoyenneEnumValues,
  prioriteEnumValues,
  statutsEnumValues,
} from '@/backend/plans/fiches/shared/models/fiche-action.table';
import { getFuse } from '@/backend/utils/fuse/fuse.utils';
import { Injectable } from '@nestjs/common';

/** Regex to detect spaces */
const regexEspace = /\\t|\\r|\\n/;

/**
 * Regex to detect tags in a string
 * Separates when there is a comma unless it is in parentheses or quotation marks
 */
const regexSplit = /,(?![^()]*\))(?=(?:(?:[^"]*"){2})*[^"]*$)(?![^«]*»)/;

/** Accept some synonyms for "niveau de priorité" */
const niveauxPrioritesSynonyme: Record<string, string> = {
  Bas: 'Bas',
  Moyen: 'Moyen',
  Eleve: 'Élevé',
};
/** List of "niveau de priorité" with synonyms for fuse */
const niveauxPriorites =
  prioriteEnumValues && Object.keys(niveauxPrioritesSynonyme);

@Injectable()
export class ImportPlanCleanService {
  /**
   * Clean a text
   * @param text
   * @param title true if the text is a title and mustn't contain a line break
   * @return cleaned text
   */
  text(text: string, title = false): string | undefined {
    return !text
      ? undefined
      : String(title ? String(text).replace(regexEspace, ' ') : text).trim();
  }

  /**
   * Clean an integer from a string
   * @param integer
   * @return cleaned integer
   */
  int(integer: string): number | undefined {
    if (!integer) {
      return undefined;
    }
    const toReturn = parseInt(integer);
    if (isNaN(toReturn)) {
      throw new Error(
        `Le montant "<em>${String(
          integer
        )}</em>" est incorrect, les montants ne doivent contenir que des chiffres.`
      );
    }
    return toReturn;
  }

  /**
   * Clean a boolean from a string
   * @param boolean
   * @return cleaned boolean
   */
  boolean(boolean: boolean | string | undefined): boolean | undefined {
    if (typeof boolean == 'boolean') {
      return boolean;
    }
    if (typeof boolean == 'string') {
      const s: string = boolean.toLowerCase();
      if (s == 'true' || s == 'vrai') {
        return true;
      } else if (s == 'false' || s == 'faux') {
        return false;
      }
    }
    return undefined;
  }

  /**
   * Clean a date from a string
   * @param date
   * @return cleaned date
   */
  date(date: string | undefined): string | undefined {
    if (!date) {
      return undefined;
    }
    let d = new Date(date);
    if (d.toString() == 'Invalid Date') {
      const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      const match = date.match(regex);
      if (match) {
        const [, day, month, year] = match;
        const invertedDate = `${month}/${day}/${year}`;
        d = new Date(invertedDate);
      }
    }
    if (d.toString() == 'Invalid Date') {
      throw Error(`La date <em>${date}</em> n'est pas valide.`);
    }
    const toReturn = d.toISOString();
    if (toReturn.substring(0, 10) === '1970-01-01') {
      return undefined;
    }
    return toReturn;
  }

  /**
   * Clean a person
   * @param personnes
   * @param existingTags
   * @param members
   * @return list of user ids and tags
   */
  async persons(
    personnes: string | undefined,
    existingTags: Set<TagImport>,
    members: Record<string, string>
  ): Promise<PersonneImport[]> {
    if (!personnes) return [];
    const toReturn: PersonneImport[] = [];
    const tab: string[] = String(personnes).split(regexSplit);
    const Fuse = await getFuse();
    const fuse = new Fuse(Array.from(Object.keys(members)), {
      threshold: 0.3,
      distance: 100,
    });
    for (const element of tab) {
      const cleaned = this.text(element);
      if (cleaned && !cleaned.match(regexSplit)) {
        const found = fuse.search(cleaned)?.[0]?.item;
        let tag: TagImport | undefined;
        let userId: string | undefined;
        if (found) {
          userId = members[found];
        } else {
          tag = this.getOrCreateTag(cleaned, TagEnum.Personne, existingTags);
        }
        if (userId || tag) toReturn.push({ tag, userId });
      }
    }
    return toReturn;
  }

  /**
   * Clean tags from a string
   * @param tags
   * @param tagType
   * @param existingTags
   * @return cleaned tags
   */
  tags(
    tags: string | undefined,
    tagType: TagType,
    existingTags: Set<TagImport>
  ): TagImport[] {
    if (!tags) return [];
    const toReturn: TagImport[] = [];
    const tab: string[] = String(tags).split(regexSplit);
    for (const element of tab) {
      if (element && !element.match(regexSplit)) {
        const tag = this.getOrCreateTag(
          this.text(element, true),
          tagType,
          existingTags
        );
        if (tag) toReturn.push(tag);
      }
    }
    return toReturn;
  }

  /**
   * Get an existing tag with the same name and type or create a new one
   * @param tagName
   * @param tagType
   * @param existingTags
   * @private
   */
  private getOrCreateTag(
    tagName: string | undefined,
    tagType: TagType,
    existingTags: Set<TagImport>
  ): TagImport | undefined {
    if (!tagName) return undefined;
    let toReturn: TagImport | undefined;
    toReturn = [...existingTags].find(
      (tag) => tag.nom === tagName && tag.type === tagType
    );
    if (!toReturn) {
      toReturn = {
        nom: tagName,
        type: tagType,
      };
      existingTags.add(toReturn);
    }
    return toReturn;
  }

  /**
   * Clean a "cible"
   * @param cible
   * @return cleaned "cible"
   */
  async cible(cible: string): Promise<Cible | undefined> {
    if (!cible) return undefined;
    const Fuse = await getFuse();
    const fuse = new Fuse(ciblesEnumValues);
    const cleaned = this.text(cible);
    if (!cleaned) return undefined;
    return fuse.search(cleaned)?.[0]?.item;
  }

  /**
   * Clean an "effet attendu"
   * @param effetAttendu
   * @param effetsAttendus
   * @return associated id
   */
  async effetAttendu(
    effetAttendu: string,
    effetsAttendus: Record<string, number>
  ): Promise<number | undefined> {
    if (!effetAttendu) return undefined;
    const Fuse = await getFuse();
    const fuse = new Fuse(Array.from(Object.keys(effetsAttendus)));
    const cleaned = this.text(effetAttendu);
    if (!cleaned) return undefined;
    const found = fuse.search(cleaned)?.[0]?.item;
    if (!found) return undefined;
    return effetsAttendus[found];
  }

  /**
   * Clean a "participation citoyenne"
   * @param participation
   * @return cleaned "participation citoyenne"
   */
  async participation(
    participation: string
  ): Promise<ParticipationCitoyenne | undefined> {
    if (!participation) return undefined;
    const Fuse = await getFuse();
    const fuse = new Fuse(participationCitoyenneEnumValues);
    const cleaned = this.text(participation);
    if (!cleaned) return undefined;
    return fuse.search(cleaned)?.[0]?.item;
  }

  /**
   * Clean a "statut"
   * @param statut
   * @return cleaned "statut"
   */
  async statut(statut: string): Promise<Statut | undefined> {
    if (!statut) return undefined;
    const Fuse = await getFuse();
    const fuse = new Fuse(statutsEnumValues);
    const cleaned = this.text(statut);
    if (!cleaned) return undefined;
    return fuse.search(cleaned)?.[0]?.item;
  }

  /**
   * Clean a "niveau de priorite"
   * @param priorite
   * @return cleaned "niveau de priorite"
   */
  async priorite(priorite: string): Promise<Priorite | undefined> {
    if (!priorite) return undefined;
    const Fuse = await getFuse();
    const fuse = new Fuse(niveauxPriorites);
    const cleaned = this.text(priorite);
    if (!cleaned) return undefined;
    const found = fuse.search(cleaned)?.[0]?.item;
    if (!found) return undefined;
    return (niveauxPrioritesSynonyme[found] || found) as Priorite;
  }

  /**
   * Clean a "thematique"
   * @param thematique
   * @param thematiques
   * @return associated id
   */
  async thematique(
    thematique: string,
    thematiques: Record<string, number>
  ): Promise<number | undefined> {
    if (!thematique) return undefined;
    const Fuse = await getFuse();
    const fuse = new Fuse(Array.from(Object.keys(thematiques)));
    const cleaned = this.text(thematique);
    if (!cleaned) return undefined;
    const found = fuse.search(cleaned)?.[0]?.item;
    if (!found) return undefined;
    return thematiques[found];
  }
}
