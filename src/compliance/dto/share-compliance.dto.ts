import { IsEmail, IsNotEmpty } from 'class-validator';

export class ShareComplianceDto {
    @IsNotEmpty()
    @IsEmail()
    email: string;
}
