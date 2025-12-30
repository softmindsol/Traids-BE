export class LoginDto {
  email: string;
  password: string;
  userType: 'company' | 'subcontractor';
}
