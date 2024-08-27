import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import CollectiviteRequest from '../../collectivites/models/collectivite.request';
import { IndicateurAvecValeursParSource } from './indicateur.models';

/**
 * - <b>collectiviteId</b> : identifiant de la collectivité
 * - <b>identifiantReferentiel</b> : liste des identifiants référentiels des indicateurs <i>(ex : cae_1.a)</i>
 * - <b>indicateurId</b> : identifiant d'un indicateur
 * - <b>dateDebut</b> : date minimum
 * - <b>dateFin</b> : date maximum
 * - <b>sourceId</b> : identifiant de la source, null pour les valeurs utilisateurs, unknown pour tous
 * - <b>cleanDoublon</b> : vrai pour enlever les doublons du trio indicateur, collectivite, année <i>(faux par défaut)</i>
 */
export class GetIndicateursValeursRequest extends CollectiviteRequest {
  @ApiProperty({ description: 'Identifiants du référentiel' })
  @IsString({ each: true })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => (Array.isArray(value) ? value : value.split(',')))
  identifiants_referentiel?: string[];

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  indicateur_id?: number;

  @Length(10, 10)
  @IsDateString()
  @IsOptional()
  date_debut?: string;

  @Length(10, 10)
  @IsDateString()
  @IsOptional()
  date_fin?: string;

  @IsString({ each: true })
  @IsArray()
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : value.split(',')))
  sources?: string[] | null;

  //TODO: dedoublonnage?: boolean;
}

export class GetIndicateursValeursResponse {
  @ApiProperty({ type: IndicateurAvecValeursParSource, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IndicateurAvecValeursParSource)
  indicateurs: IndicateurAvecValeursParSource[];
}
