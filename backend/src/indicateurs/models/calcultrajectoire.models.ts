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

export class CalculTrajectoireResponseDonnees {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IndicateurAvecValeurs)
  emissions_ges: IndicateurAvecValeurs[];

  @ApiProperty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IndicateurAvecValeurs)
  consommations_finales: IndicateurAvecValeurs[];
}

export class CalculTrajectoireResponse {
  @ApiProperty({ description: 'Résultat du calcul de la trajectoire' })
  @ValidateNested()
  @Type(() => CalculTrajectoireResponseDonnees)
  trajectoire: CalculTrajectoireResponseDonnees;
}

export class CalculTrajectoireResult extends CalculTrajectoireResponse {
  @IsString()
  spreadsheet_id: string;
}

export class DonneesARemplirResult {
  valeurs: {
    identifiants_referentiel: string[];
    valeur: number | null;
  }[];
  identifiants_referentiel_manquants: string[];
}

export class DonneesCalculTrajectoireARemplir {
  emissions_ges: DonneesARemplirResult;
  consommations_finales: DonneesARemplirResult;
}
