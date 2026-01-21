export class SignUpSubcontractorDto {
  fullName: string;
  primaryTrade: string;
  yearsOfExperience?: number;
  postcode: string;
  cityLocation: string;
  insurance?: { documents: string[]; expiresAt?: Date };
  tickets?: { documents: string[]; expiresAt?: Date };
  certification?: { documents: string[]; expiresAt?: Date };
  profileImage?: string;
  hourlyRate: number;
  password: string;
  email: string;
  professionalBio?: string;
  workExamples?: string[];
}
