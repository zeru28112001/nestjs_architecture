import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';
import { isNumber } from 'class-validator';

@Injectable()
export class ParseNumberPipe implements PipeTransform<number> {
  constructor(private readonly valueName: string) {}

  transform(value: any): any {
    const errorMessage = `Invalid ${this.valueName} value, ${this.valueName} must be number`;
    try {
      if (value === undefined || value === null) {
        return value;
      }

      if (!isNumber(Number(value))) {
        throw new Error(errorMessage);
      }

      return Number(value);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}

