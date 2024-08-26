import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import CollectiviteRequest from '../../collectivites/models/collectivite.request';
import optionalBooleanMapper from '../../common/services/optionalBooleanMapper';
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

export class ModeleTrajectoireTelechargementRequest {
  @ApiProperty({
    required: false,
    description:
      'Récupère les données du fichier xlsx depuis le drive plutôt que le cache local',
  })
  @IsBoolean()
  @Transform(({ value }) => optionalBooleanMapper.get(value)) // Useful for query param
  @IsOptional()
  force_recuperation_xlsx?: boolean;
}

export class VerificationTrajectoireRequest extends CollectiviteRequest {
  @ApiProperty({
    required: false,
    description:
      'Récupère les données même si la trajectoire a déjà été calculée',
  })
  @IsBoolean()
  @Transform(({ value }) => optionalBooleanMapper.get(value)) // Useful for query param
  @IsOptional()
  force_recuperation_donnees?: boolean;
}

export class CalculTrajectoireRequest extends CollectiviteRequest {
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

export class DonneesARemplirValeur {
  identifiants_referentiel: string[];
  valeur: number | null;
  date_min: string | null;
  date_max: string | null;
}

export class DonneesARemplirResult {
  valeurs: DonneesARemplirValeur[];
  identifiants_referentiel_manquants: string[];
}

export class DonneesCalculTrajectoireARemplir {
  emissions_ges: DonneesARemplirResult;
  consommations_finales: DonneesARemplirResult;
}
