import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseStringArrayPipe implements PipeTransform<
  string | string[],
  string[]
> {
  constructor(
    private readonly valueName: string,
    private readonly allowedValues?: string[],
  ) {}

  transform(value: any): any {
    const formatErrorMessage = `Invalid array format of ${this.valueName}`;
    const valueErrorMessage = `Invalid value in ${this.valueName}, ${this.valueName} must be array of the following values: ${this.allowedValues}`;
    try {
      if (value === undefined || value === null) {
        return value;
      }

      let parsedValue: string[];

      if (Array.isArray(value)) {
        parsedValue = value;
      } else {
        const trimmedValue = value.trim();

        if (trimmedValue.startsWith('[')) {
          const jsonParsedValue = JSON.parse(trimmedValue);
          if (!Array.isArray(jsonParsedValue)) {
            throw new Error(formatErrorMessage);
          }
          parsedValue = jsonParsedValue;
        } else if (trimmedValue.includes(',')) {
          parsedValue = trimmedValue
            .split(',')
            .map((item: string) => item.trim())
            .filter(Boolean);
        } else {
          parsedValue = [trimmedValue];
        }
      }

      if (!Array.isArray(parsedValue)) {
        throw new Error(formatErrorMessage);
      }

      if (parsedValue.length === 0) {
        return parsedValue;
      }

      const filteredArray = parsedValue.filter(
        (item: any) => !this.allowedValues || this.allowedValues.includes(item),
      );

      if (this.allowedValues && filteredArray.length !== parsedValue.length) {
        throw new Error(valueErrorMessage);
      }

      return filteredArray.map((item: any) => String(item));
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}

