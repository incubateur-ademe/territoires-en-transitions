import { CollectiviteMembresService } from '@/backend/collectivites/membres/membres.service';
import { TagService } from '@/backend/collectivites/tags/tag.service';
import { TagType } from '@/backend/collectivites/tags/tag.table-base';
import { TagImport } from '@/backend/plans/fiches/import/import-plan.dto';
import { EffetAttenduService } from '@/backend/shared/effet-attendu/effet-attendu.service';
import { ThematiqueService } from '@/backend/shared/thematiques/thematique.service';
import { Injectable } from '@nestjs/common';

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
      result.data.flatMap(({ prenom, nom, userId }) => [
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
