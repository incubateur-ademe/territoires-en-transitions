import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { IndicateurAvecValeurs } from './indicateur.models';

export enum CalculTrajectoireReset {
  MAJ_SPREADSHEET_EXISTANT = 'maj_spreadsheet_existant',
  NOUVEAU_SPREADSHEET = 'nouveau_spreadsheet',
}

export enum CalculTrajectoireResultatMode {
  DONNEES_EN_BDD = 'donnees_en_bdd',
  NOUVEAU_SPREADSHEET = 'nouveau_spreadsheet',
  MAJ_SPREADSHEET_EXISTANT = 'maj_spreadsheet_existant',
}

export class CalculTrajectoireRequest {
  @ApiProperty({ description: 'Identifiant de la collectivité' })
  @IsInt()
  @Type(() => Number)
  collectivite_id: number;

  @ApiProperty({
    required: false,
    description: 'Mode pour forcer la recréation de la trajectoire',
  })
  @IsEnum(CalculTrajectoireReset)
  @IsOptional()
  mode?: CalculTrajectoireReset;
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
  @IsEnum(CalculTrajectoireResultatMode)
  mode: CalculTrajectoireResultatMode;

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
