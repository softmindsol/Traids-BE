import { IsEmail, IsNotEmpty, IsString, IsIn } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['company', 'subcontractor'])
  userType: 'company' | 'subcontractor';
}
