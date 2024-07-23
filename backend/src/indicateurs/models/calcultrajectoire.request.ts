import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional } from 'class-validator';
import optionalBooleanMapper from '../../common/services/optionalBooleanMapper';

export default class CalculTrajectoireRequest {
  @IsInt()
  @Type(() => Number)
  collectivite_id: number;

  @IsBoolean()
  @Transform(({ value }) => optionalBooleanMapper.get(value)) // Useful for query param
  @IsOptional()
  conserve_fichier_temporaire?: boolean;
}
