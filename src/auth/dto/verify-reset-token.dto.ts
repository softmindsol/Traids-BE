import { IsEmail, IsNotEmpty, IsString, IsIn } from 'class-validator';

export class VerifyResetTokenDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  resetToken: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['company', 'subcontractor'])
  userType: 'company' | 'subcontractor';
}
