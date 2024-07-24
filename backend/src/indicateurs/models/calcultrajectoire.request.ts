import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional } from 'class-validator';
import optionalBooleanMapper from '../../common/services/optionalBooleanMapper';

export default class CalculTrajectoireRequest {
  @ApiProperty({ description: 'Identifiant de la collectivité' })
  @IsInt()
  @Type(() => Number)
  collectivite_id: number;

  @ApiProperty({
    required: false,
    description: 'Ne supprime pas le spreadsheet temporaire de calcul',
  })
  @IsBoolean()
  @Transform(({ value }) => optionalBooleanMapper.get(value)) // Useful for query param
  @IsOptional()
  conserve_fichier_temporaire?: boolean;
}
