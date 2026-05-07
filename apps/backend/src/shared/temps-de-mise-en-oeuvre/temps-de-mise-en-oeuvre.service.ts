import { tempsDeMiseEnOeuvreTable } from '@tet/backend/shared/models/temps-de-mise-en-oeuvre.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Injectable } from '@nestjs/common';
import { TempsDeMiseEnOeuvre } from '@tet/domain/shared';

@Injectable()
export class TempsDeMiseEnOeuvreService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getTempsDeMiseEnOeuvre(): Promise<TempsDeMiseEnOeuvre[]> {
    return this.databaseService.db.select().from(tempsDeMiseEnOeuvreTable);
  }
}
