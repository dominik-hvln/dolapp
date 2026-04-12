import { IsNotEmpty, IsNumber } from 'class-validator';

export class LocationDto {
    @IsNumber()
    @IsNotEmpty()
    latitude: number;

    @IsNumber()
    @IsNotEmpty()
    longitude: number;
}
