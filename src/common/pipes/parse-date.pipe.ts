import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseDatePipe implements PipeTransform<string> {
  constructor(private readonly valueName: string) {}

  transform(value: any): any {
    if (value === undefined || value === null) {
      return value;
    }

    const parsedDate = new Date(value);

    if (isNaN(parsedDate.getTime())) {
      throw new BadRequestException(
        `Invalid ${this.valueName} format, expected a valid date string`,
      );
    }

    return parsedDate;
  }
}

