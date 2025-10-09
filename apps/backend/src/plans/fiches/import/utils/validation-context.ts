import { CollectiviteMembresService } from '@/backend/collectivites/membres/membres.service';
import { TagService } from '@/backend/collectivites/tags/tag.service';
import { TagType } from '@/backend/collectivites/tags/tag.table-base';
import { EffetAttenduService } from '@/backend/shared/effet-attendu/effet-attendu.service';
import { ThematiqueService } from '@/backend/shared/thematiques/thematique.service';
import { Result, failure, success } from '../types/result';
import {
  ValidationError,
  ValidationErrorCode,
} from '../types/validation-error';

/**
 * Validation context that lazily fetches reference data as needed
 */
export class ValidationContext {
  private memberCache: Record<string, string> | null = null;
  private tagCache: Map<TagType, Set<string>> = new Map();
  private thematiquesCache: Record<string, number> | null = null;
  private sousThematiquesCache: Record<string, number> | null = null;
  private effetsAttenduCache: Record<string, number> | null = null;

  constructor(
    private readonly collectiviteId: number,
    private readonly memberService: CollectiviteMembresService,
    private readonly tagService: TagService,
    private readonly thematiqueService: ThematiqueService,
    private readonly effetAttenduService: EffetAttenduService
  ) {}

  /**
   * Get member ID by name, fetching member data if needed
   */
  async getMemberId(
    name: string
  ): Promise<Result<string | undefined, ValidationError>> {
    try {
      if (!this.memberCache) {
        const members = await this.memberService.list({
          collectiviteId: this.collectiviteId,
        });
        if (!members || members.length === 0) {
          return failure({
            code: ValidationErrorCode.INVALID_DATA,
            message: 'No members found for collectivité',
          });
        }
        this.memberCache = Object.fromEntries(
          members.flatMap(({ prenom, nom, userId }) => [
            [`${prenom} ${nom}`, userId],
            [`${nom} ${prenom}`, userId],
          ])
        );
      }
      return success(this.memberCache[name]);
    } catch (error) {
      return failure({
        code: ValidationErrorCode.UNKNOWN_ERROR,
        message: `Error fetching members: ${error}`,
      });
    }
  }

  /**
   * Check if a tag exists for a given type, fetching tag data if needed
   */
  async hasTag(
    name: string,
    type: TagType
  ): Promise<Result<boolean, ValidationError>> {
    try {
      if (!this.tagCache.has(type)) {
        const tags = await this.tagService.getTags(this.collectiviteId, type);
        this.tagCache.set(type, new Set(tags.map((t) => t.nom)));
      }
      return success(this.tagCache.get(type)!.has(name));
    } catch (error) {
      return failure({
        code: ValidationErrorCode.UNKNOWN_ERROR,
        message: `Error fetching tags: ${error}`,
      });
    }
  }

  /**
   * Get thematique ID by name, fetching thematique data if needed
   */
  async getThematiqueId(
    name: string
  ): Promise<Result<number | undefined, ValidationError>> {
    try {
      if (!this.thematiquesCache) {
        const thematiques = await this.thematiqueService.getThematiques();
        if (!thematiques || thematiques.length === 0) {
          return failure({
            code: ValidationErrorCode.INVALID_DATA,
            message: 'No thématiques found',
          });
        }
        this.thematiquesCache = Object.fromEntries(
          thematiques.map(({ nom, id }) => [nom, id])
        );
      }
      return success(this.thematiquesCache[name]);
    } catch (error) {
      return failure({
        code: ValidationErrorCode.UNKNOWN_ERROR,
        message: `Error fetching thématiques: ${error}`,
      });
    }
  }

  /**
   * Get sous-thematique ID by name, fetching sous-thematique data if needed
   */
  async getSousThematiqueId(
    name: string
  ): Promise<Result<number | undefined, ValidationError>> {
    try {
      if (!this.sousThematiquesCache) {
        const sousThematiques =
          await this.thematiqueService.getSousThematiques();
        if (!sousThematiques || sousThematiques.length === 0) {
          return failure({
            code: ValidationErrorCode.INVALID_DATA,
            message: 'No sous-thématiques found',
          });
        }
        this.sousThematiquesCache = Object.fromEntries(
          sousThematiques.map(({ nom, id }) => [nom, id])
        );
      }
      return success(this.sousThematiquesCache[name]);
    } catch (error) {
      return failure({
        code: ValidationErrorCode.UNKNOWN_ERROR,
        message: `Error fetching sous-thématiques: ${error}`,
      });
    }
  }

  /**
   * Get effet attendu ID by name, fetching effet attendu data if needed
   */
  async getEffetAttenduId(
    name: string
  ): Promise<Result<number | undefined, ValidationError>> {
    try {
      if (!this.effetsAttenduCache) {
        const effetsAttendu = await this.effetAttenduService.getEffetAttendu();
        if (!effetsAttendu || effetsAttendu.length === 0) {
          return failure({
            code: ValidationErrorCode.INVALID_DATA,
            message: 'No effets attendus found',
          });
        }
        this.effetsAttenduCache = Object.fromEntries(
          effetsAttendu.map(({ nom, id }) => [nom, id])
        );
      }
      return success(this.effetsAttenduCache[name]);
    } catch (error) {
      return failure({
        code: ValidationErrorCode.UNKNOWN_ERROR,
        message: `Error fetching effets attendus: ${error}`,
      });
    }
  }
}
