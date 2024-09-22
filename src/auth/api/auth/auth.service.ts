import type { User } from "@prisma/client";
import { BadRequestException } from "../../../exceptions/bad-request.exception";
import { validateHash } from "../../utils/password";
import { type CleanUser, UsersService } from "../users/users.service";
import type { TRegisterBody } from "./schemas/register-body.schema";
import type { TLoginBody } from "./schemas/login-body.schema";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt";
import ms from "ms";
import { configs } from "../../../configs";
import { UnauthenticatedException } from "../../exceptions/unauthenticated.exception";

// =================================================================================================
/**
 * Type for authentication / refresh response to user
 */
export interface AuthResponse {
  user: CleanUser;
  accessToken: {
    token: string;
    issuedAt?: number;
    expiresAt?: number;
  };
  refreshToken: {
    token: string;
    issuedAt?: number;
    expiresAt?: number;
  };
}

// =================================================================================================

export class AuthService {
  private readonly usersService: UsersService;

  constructor() {
    this.usersService = new UsersService();
  }
  // -----------------------------------------------------------------------------------------------
  // Register
  async register(registerData: TRegisterBody): Promise<AuthResponse> {
    const newUser = await this.usersService.createUser(registerData);

    // Login
    return this.generateTokens(newUser);
  }

  // -----------------------------------------------------------------------------------------------
  // Login
  async login(loginData: TLoginBody): Promise<AuthResponse> {
    // Get user from user service including password
    const user: User = (await this.usersService.getUserByEmail(
      loginData.email,
      true
    )) as User;
    if (!user || !user.password) {
      throw new BadRequestException("Bad Credentials");
    }

    // Validate password
    const isPasswordValid = await validateHash(
      loginData.password,
      user.password
    );
    if (!isPasswordValid) {
      throw new BadRequestException("Bad Credentials");
    }

    return this.generateTokens(user);
  }

  // -----------------------------------------------------------------------------------------------
  // Refresh token
  async refresh(refreshToken: string): Promise<AuthResponse> {
    return this.refreshAccessToken(refreshToken);
  }

  // -----------------------------------------------------------------------------------------------
  async me(userId: number): Promise<CleanUser> {
    return this.usersService.getUser(userId);
  }

  // -----------------------------------------------------------------------------------------------
  // Utility
  // -----------------------------------------------------------------------------------------------
  /**
   * A utility function to generate access and refresh tokens
   *
   * @param user the user for which we want to generate tokens
   * @returns the generated tokens
   */
  private generateTokens(user: CleanUser): AuthResponse {
    const issuedAt = new Date().getTime();
    const accessTokenExpiresAt =
      issuedAt + ms(configs.auth.JWT_ACCESS_TOKEN_EXPIRATION_TIME);
    const refreshTokenExpiresAt =
      issuedAt + ms(configs.auth.JWT_REFRESH_TOKEN_EXPIRATION_TIME);

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return {
      user: user,
      accessToken: {
        token: accessToken,
        issuedAt,
        expiresAt: accessTokenExpiresAt,
      },
      refreshToken: {
        token: refreshToken,
        issuedAt,
        expiresAt: refreshTokenExpiresAt,
      },
    };
  }

  // -----------------------------------------------------------------------------------------------
  /**
   * A utility function to create a new access token from a refresh token
   *
   * @param refreshToken the refresh token
   * @returns the new access token and the old refresh token
   */
  private async refreshAccessToken(
    refreshToken: string
  ): Promise<AuthResponse> {
    const payload = verifyRefreshToken(refreshToken);

    if (!payload) {
      throw new UnauthenticatedException();
    }

    const user: CleanUser = await this.usersService.getUser(
      Number(payload.sub)
    );

    if (!user) {
      throw new UnauthenticatedException();
    }

    const accessTokenExpiresAt =
      new Date().getTime() + ms(configs.auth.JWT_ACCESS_TOKEN_EXPIRATION_TIME);

    const tokens = {
      user: user,
      accessToken: {
        token: generateAccessToken(user),
        issuedAt: new Date().getTime(),
        expiresAt: accessTokenExpiresAt,
      },
      refreshToken: {
        token: refreshToken,
        issuedAt: payload.iat,
        expiresAt: payload.exp,
      },
    };

    return tokens;
  }

  // -----------------------------------------------------------------------------------------------
}
