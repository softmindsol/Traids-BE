export class ResetPasswordDto {
  email: string;
  userType: 'company' | 'subcontractor';
  resetToken: string;
  newPassword: string;
}
