import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { ApiResponse } from '../../common/http/api-response.js';
import { AuthRepository } from './auth.repository.js';
import type { LoginDto, RegisterDto } from './dto/auth.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.repository.findByEmail(dto.email.toLowerCase());
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.repository.createUser({
      email: dto.email.toLowerCase(),
      passwordHash,
      name: dto.name,
      role: 'USER',
    });

    const token = this.generateToken(user.id);
    return ApiResponse.created(
      {
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        accessToken: token,
      },
      'User registered successfully.',
    );
  }

  async login(dto: LoginDto) {
    const user = await this.repository.findByEmail(dto.email.toLowerCase());
    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const matches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.generateToken(user.id);
    return ApiResponse.success(
      {
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        accessToken: token,
      },
      'Login successful.',
    );
  }

  private generateToken(userId: string): string {
    return this.jwtService.sign({ sub: userId });
  }
}

