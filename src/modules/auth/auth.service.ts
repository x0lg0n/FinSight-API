import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { ErrorFactory } from '../../utils/ApiError';
import { Role } from '@prisma/client';

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    isActive: boolean;
  };
}

/**
 * Authentication service
 * Handles user registration, login, and JWT token generation
 */
export class AuthService {
  /**
   * Register a new user
   * New users default to VIEWER role
   */
  static async register(input: RegisterInput): Promise<AuthResponse> {
    const { email, password, name } = input;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw ErrorFactory.conflict(`User with email ${email} already exists`, 'USER_EXISTS');
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: Role.VIEWER, // Default role
      },
    });

    // Generate token
    const token = this.generateToken(user);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
      },
    };
  }

  /**
   * Login user and return JWT token
   */
  static async login(input: LoginInput): Promise<AuthResponse> {
    const { email, password } = input;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw ErrorFactory.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Check if user is active
    if (!user.isActive) {
      throw ErrorFactory.unauthorized('User account is deactivated', 'USER_INACTIVE');
    }

    // Compare passwords
    const passwordMatch = await bcryptjs.compare(password, user.password);

    if (!passwordMatch) {
      throw ErrorFactory.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Generate token
    const token = this.generateToken(user);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
      },
    };
  }

  /**
   * Get current user by ID
   */
  static async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw ErrorFactory.notFound('User not found', 'USER_NOT_FOUND');
    }

    return user;
  }

  /**
   * Generate JWT token
   */
  private static generateToken(user: any): string {
    return jwt.sign(
      {
        userId: user.id,
        role: user.role,
        email: user.email,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRY as jwt.SignOptions['expiresIn'] },
    );
  }
}
