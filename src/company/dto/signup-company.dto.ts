export class SignUpCompanyDto {
  companyName: string;
  registrationNumber: string;
  vatNumber?: string;
  industryType: string;
  primaryContactName: string;
  workEmail: string;
  phoneNumber: string;
  password: string;
  headOfficeAddress: string;
  companyDocuments?: string[];
  insuranceCertificate?: string;
  healthAndSafetyPolicy?: string;
}
