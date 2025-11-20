import { Injectable } from '@nestjs/common';
import { CollectiviteMembresService } from '@tet/backend/collectivites/membres/membres.service';
import { TagService } from '@tet/backend/collectivites/tags/tag.service';
import { TagImport } from '@tet/backend/plans/fiches/import/import-plan.dto';
import { EffetAttenduService } from '@tet/backend/shared/effet-attendu/effet-attendu.service';
import { ThematiqueService } from '@tet/backend/shared/thematiques/thematique.service';
import { TagType } from '@tet/domain/collectivites';

@Injectable()
export class ImportPlanFetchService {
  constructor(
    private readonly effetAttenduService: EffetAttenduService,
    private readonly tagService: TagService,
    private readonly memberService: CollectiviteMembresService,
    private readonly thematiqueService: ThematiqueService
  ) {}

  async tags(collectiviteId: number, tagType: TagType): Promise<TagImport[]> {
    const result = await this.tagService.getTags(collectiviteId, tagType);
    return result.map(({ id, nom }) => ({
      nom,
      id,
      type: tagType,
    }));
  }

  async effetsAttendus(): Promise<Record<string, number>> {
    const result = await this.effetAttenduService.getEffetAttendu();
    return Object.fromEntries(result.map(({ nom, id }) => [nom, id]));
  }

  async members(collectiviteId: number): Promise<Record<string, string>> {
    const result = await this.memberService.list({
      collectiviteId,
    });
    return Object.fromEntries(
      result.flatMap(({ prenom, nom, userId }) => [
        [`${prenom} ${nom}`, userId],
        [`${nom} ${prenom}`, userId],
      ])
    );
  }

  async thematiques(): Promise<Record<string, number>> {
    const result = await this.thematiqueService.getThematiques();
    return Object.fromEntries(result.map(({ nom, id }) => [nom, id]));
  }

  async sousThematiques(): Promise<Record<string, number>> {
    const result = await this.thematiqueService.getSousThematiques();
    return Object.fromEntries(result.map(({ nom, id }) => [nom, id]));
  }
}
