import { IsString, IsNotEmpty, IsEmail, IsNumber, IsOptional, IsArray, Min, MinLength } from 'class-validator';

export class SignUpSubcontractorDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  primaryTrade: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  yearsOfExperience?: number;

  @IsString()
  @IsNotEmpty()
  postcode: string;

  @IsString()
  @IsNotEmpty()
  cityLocation: string;

  @IsOptional()
  insurance?: { documents: string[]; expiresAt?: Date };

  @IsOptional()
  tickets?: { documents: string[]; expiresAt?: Date };

  @IsOptional()
  certification?: { documents: string[]; expiresAt?: Date };

  @IsOptional()
  @IsString()
  profileImage?: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  hourlyRate: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsString()
  professionalBio?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  workExamples?: string[];
}
