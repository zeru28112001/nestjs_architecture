import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseNumberArrayPipe implements PipeTransform<number[]> {
  constructor(private readonly valueName: string) {}

  transform(value: any): any {
    try {
      if (value === undefined || value === null) {
        return value;
      }
      const parsedValue = Array.isArray(value) ? value : JSON.parse(value);
      if (!Array.isArray(parsedValue)) {
        throw new Error(`Invalid array format of ${this.valueName}`);
      }

      if (parsedValue.length === 0) {
        return parsedValue;
      }

      const numberArray = parsedValue.map((item: any) => {
        const parsedNumber = parseFloat(item);
        if (isNaN(parsedNumber)) {
          throw new Error(`Invalid number value: ${item} of ${this.valueName}`);
        }
        return parsedNumber;
      });

      return numberArray;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}

