import { IsEmail, IsNotEmpty, IsString, IsIn, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['company', 'subcontractor'])
  userType: 'company' | 'subcontractor';

  @IsString()
  @IsNotEmpty()
  resetToken: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}
