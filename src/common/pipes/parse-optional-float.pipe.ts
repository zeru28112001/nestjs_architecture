import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

/**
 * Parses an optional float query/param value.
 * - missing or empty string (`undefined`, `null`, `''`) → `undefined`
 * - a valid numeric string → the parsed `number`
 * - any other non-numeric string → `400 Bad Request`
 */
@Injectable()
export class ParseOptionalFloatPipe
  implements PipeTransform<string | undefined, number | undefined>
{
  constructor(private readonly valueName = 'value') {}

  transform(value?: string): number | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const parsed = Number.parseFloat(value);
    if (Number.isNaN(parsed)) {
      throw new BadRequestException(
        `Invalid ${this.valueName} value, ${this.valueName} must be a number`,
      );
    }

    return parsed;
  }
}

