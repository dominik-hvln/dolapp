import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteAccountDto {
    @IsNotEmpty({ message: 'Hasło jest wymagane.' })
    @IsString()
    password: string;
}
