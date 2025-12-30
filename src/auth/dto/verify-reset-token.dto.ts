export class VerifyResetTokenDto {
  email: string;
  resetToken: string;
  userType: 'company' | 'subcontractor';
}
