import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import {
  CleAppariement,
  decouperSiret,
  TypeCorrespondant,
} from './resolve-service.rules';

export type ServiceResolu = {
  collectiviteId: number;
  nom: string;
  type: TypeCorrespondant;
};

export type ResolutionServiceError = 'SERVICE_INTROUVABLE' | 'SERVICE_AMBIGU';

@Injectable()
export class ResolveServiceRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * La ligne `collectivite` que désigne une clé d'appariement.
   *
   * Sur le périmètre **principal** seulement : la DR ADEME Océan Indien couvre
   * deux régions, la seconde par un périmètre secondaire. La résoudre par ses
   * périmètres lui vaudrait deux fois le même message.
   */
  async resoudre(
    type: TypeCorrespondant,
    cle: CleAppariement
  ): Promise<Result<ServiceResolu, ResolutionServiceError>> {
    const services = await this.databaseService.db
      .select({
        collectiviteId: collectiviteTable.id,
        nom: collectiviteTable.nom,
      })
      .from(collectiviteTable)
      .where(and(eq(collectiviteTable.type, type), this.cleWhere(cle)))
      .limit(2);

    if (!services.length) {
      return failure('SERVICE_INTROUVABLE');
    }
    // `region` et `service_national` n'ont pas d'index unique : l'ambiguïté est
    // un cas réel, pas une précaution.
    if (services.length > 1) {
      return failure('SERVICE_AMBIGU');
    }

    return success({
      collectiviteId: services[0].collectiviteId,
      nom: services[0].nom ?? '',
      type,
    });
  }

  private cleWhere(cle: CleAppariement) {
    if (cle.colonne === 'region_code') {
      return eq(collectiviteTable.regionCode, cle.valeur);
    }
    if (cle.colonne === 'departement_code') {
      return eq(collectiviteTable.departementCode, cle.valeur);
    }

    const { siren, nic } = decouperSiret(cle.valeur);
    return and(
      eq(collectiviteTable.siren, siren),
      eq(collectiviteTable.nic, nic)
    );
  }
}
