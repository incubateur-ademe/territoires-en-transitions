import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import optionalBooleanMapper from '../../common/services/optionalBooleanMapper';
import { IndicateurAvecValeurs } from './indicateur.models';

export class CalculTrajectoireRequest {
  @ApiProperty({ description: 'Identifiant de la collectivité' })
  @IsInt()
  @Type(() => Number)
  collectivite_id: number;

  @ApiProperty({
    required: false,
    description: 'Recrée le fichier de trajectoire à partir du template',
  })
  @IsBoolean()
  @Transform(({ value }) => optionalBooleanMapper.get(value)) // Useful for query param
  @IsOptional()
  reset_fichier?: boolean;
}

export class CalculTrajectoireResponse {
  @ApiProperty({ description: 'Résultat du calcul de la trajectoire' })
  @IsArray()
  @ValidateNested()
  @Type(() => IndicateurAvecValeurs)
  trajectoire: IndicateurAvecValeurs[];
}

export class CalculTrajectoireResult extends CalculTrajectoireResponse {
  @IsString()
  spreadsheet_id: string;
}

export class DonneesARemplirResult {
  valeursARemplir: (number | null)[];
  identifiantsReferentielManquants: string[];
}

export class DonneesCalculTrajectoireARemplir {
  emissionsGes: DonneesARemplirResult;
  consommationsFinales: DonneesARemplirResult;
}
