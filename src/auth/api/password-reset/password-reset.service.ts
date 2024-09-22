import type { User } from '@prisma/client';
import ms from 'ms';

import { configs } from '../../../configs';
import { BadRequestException } from '../../../exceptions/bad-request.exception';
import { db } from '../../../utils/db';
import { generateHash } from '../../utils/password';
import { generateToken } from '../../utils/token';
import { UsersService, type CleanUser } from '../users/users.service';

import type { TForgotPasswordBody } from './schemas/forgot-password-body.schema';
import type { TResetPasswordBody } from './schemas/reset-password-body.schema';

export class PasswordResetService {
  private readonly usersService: UsersService;

  constructor() {
    this.usersService = new UsersService();
  }

  // -----------------------------------------------------------------------------------------------
  // Send Password Reset Token
  async sendPasswordResetToken(body: TForgotPasswordBody): Promise<void> {
    const { email } = body;

    // Using try-catch because user service throws a 404 error if user isn't found
    // and we don't want to send the 404 to let the user know that the email was incorrect
    let user: User | null = null;
    try {
      // Get user from user service including password
      user = (await this.usersService.getUserByEmail(email, true)) as User;
    } catch (error) {}

    if (!user) {
      // If the user isn't found, we'll return normally
      // we don't want the user to know if the email was correct or not
      return;
    }

    // Delete all previous tokens
    await db.passwordResetToken.deleteMany({ where: { userId: user.id } });

    // Generate a random token
    const token = generateToken();

    const expiresAt = new Date().getTime() + ms(configs.auth.PASSWORD_RESET_TOKEN_EXPIRATION_TIME);

    const newToken = await db.passwordResetToken.create({
      data: {
        token: token,
        expiration: new Date(expiresAt),
        user: { connect: { id: user.id } },
      },
    });

    // Todo: Link must come from env
    const link = `${configs.app.host}:${configs.app.port}/reset-password-page?token=${newToken.token}`;

    // Todo: Send link to email of the user

    console.log('-'.repeat(100));
    console.log(`🔗Password Reset Link`, link);
    console.log('-'.repeat(100));
    console.log(`🔑Password Reset Token`, newToken.token);
    console.log('-'.repeat(100));
  }

  // -----------------------------------------------------------------------------------------------
  // Reset Password
  async resetPassword(body: TResetPasswordBody): Promise<CleanUser> {
    const { token, password } = body;

    // Find PasswordResetToken entity from DB and populate its user
    const tokenEntity = await db.passwordResetToken.findFirst({
      where: { token: token },
      include: { user: true },
    });

    if (!tokenEntity) {
      throw new BadRequestException('Invalid Token');
    }

    // If token is expired
    if (tokenEntity.expiration < new Date()) {
      // Delete Token from DB
      await db.passwordResetToken.delete({
        where: { id: tokenEntity.id },
      });

      throw new BadRequestException('Token Expired');
    }

    // Check if user exists
    const user = await this.usersService.getUser(tokenEntity.user.id);
    if (!user) {
      throw new BadRequestException('Invalid Token');
    }

    // Update user's password
    const newPassword = await generateHash(password);
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        password: newPassword,
      },
    });

    // Delete All Tokens from DB belonging to this user
    await db.passwordResetToken.deleteMany({ where: { userId: user.id } });

    return this.usersService.cleanUser(updatedUser);
  }

  // -----------------------------------------------------------------------------------------------
}
