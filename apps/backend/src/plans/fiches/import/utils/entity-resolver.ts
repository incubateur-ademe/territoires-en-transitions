import { CollectiviteMembresService } from '@/backend/collectivites/membres/membres.service';
import { TagService } from '@/backend/collectivites/tags/tag.service';
import { TagType } from '@/backend/collectivites/tags/tag.table-base';
import { EffetAttenduService } from '@/backend/shared/effet-attendu/effet-attendu.service';
import { ThematiqueService } from '@/backend/shared/thematiques/thematique.service';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import { getFuse } from '@/backend/utils/fuse/fuse.utils';

export interface EntityResolver<T> {
  resolveOrCreate: (name: string, tx: Transaction) => Promise<T>;
}

export class TagResolver implements EntityResolver<number> {
  constructor(
    private tagService: TagService,
    private tagType: TagType,
    private collectiviteId: number
  ) {}

  async resolveOrCreate(name: string, tx: Transaction): Promise<number> {
    const Fuse = await getFuse();
    const tags = await this.tagService.getTags(
      this.collectiviteId,
      this.tagType
    );

    const fuse = new Fuse(tags, {
      keys: ['nom'],
      threshold: 0.3,
      ignoreLocation: true,
    });

    const match = fuse.search(name)[0]?.item;
    if (match) {
      return match.id;
    }

    // If no match found, create new tag
    const created = await this.tagService.saveTag(
      {
        nom: name,
        collectiviteId: this.collectiviteId,
      },
      this.tagType,
      tx
    );

    return created.id;
  }
}

export class MemberResolver implements EntityResolver<string> {
  constructor(
    private memberService: CollectiviteMembresService,
    private collectiviteId: number
  ) {}

  async resolveOrCreate(name: string, _tx: Transaction): Promise<string> {
    const Fuse = await getFuse();
    const members = await this.memberService.list({
      collectiviteId: this.collectiviteId,
    });

    const fuse = new Fuse(members, {
      keys: [
        { name: 'nom', weight: 0.7 },
        { name: 'prenom', weight: 0.3 },
      ],
      threshold: 0.3,
      ignoreLocation: true,
    });

    const match = fuse.search(name)[0]?.item;
    if (match) {
      return match.userId;
    }

    // If no match found, we can't create a member automatically
    throw new Error(
      `Membre "${name}" non trouvé. Les membres doivent être créés manuellement.`
    );
  }
}

export class ThematiqueResolver implements EntityResolver<number> {
  constructor(
    private thematiqueService: ThematiqueService,
    private isSousThematique = false
  ) {}

  async resolveOrCreate(name: string, _tx: Transaction): Promise<number> {
    const Fuse = await getFuse();
    const items = this.isSousThematique
      ? await this.thematiqueService.getSousThematiques()
      : await this.thematiqueService.getThematiques();

    const fuse = new Fuse(items, {
      keys: ['nom'],
      threshold: 0.3,
      ignoreLocation: true,
    });

    const match = fuse.search(name)[0]?.item;
    if (match) {
      return match.id;
    }

    throw new Error(
      `${
        this.isSousThematique ? 'Sous-thématique' : 'Thématique'
      } "${name}" non trouvée et ne peut pas être créée automatiquement`
    );
  }
}

export class EffetAttenduResolver implements EntityResolver<number> {
  constructor(private effetAttenduService: EffetAttenduService) {}

  async resolveOrCreate(name: string, _tx: Transaction): Promise<number> {
    const Fuse = await getFuse();
    const items = await this.effetAttenduService.getEffetAttendu();

    const fuse = new Fuse(items, {
      keys: ['nom'],
      threshold: 0.3,
      ignoreLocation: true,
    });

    const match = fuse.search(name)[0]?.item;
    if (match) {
      return match.id;
    }

    throw new Error(
      `Effet attendu "${name}" non trouvé et ne peut pas être créé automatiquement`
    );
  }
}
