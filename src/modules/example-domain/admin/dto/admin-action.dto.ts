import { IsNotEmpty, IsString } from 'class-validator';

export class AdminUpdateStatusDto {
  @IsString()
  @IsNotEmpty()
  status!: string;
}

