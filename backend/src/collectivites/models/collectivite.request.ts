import {ApiProperty} from "@nestjs/swagger";
import {IsInt, IsOptional} from "class-validator";
import {Type} from "class-transformer";

export default class CollectiviteRequest {
    @ApiProperty({ description: 'Identifiant de la collectivité' })
    @IsInt()
    @Type(() => Number)
    collectivite_id: number;
}