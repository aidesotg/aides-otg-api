import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

@Injectable()
export class GoogleService {
  /**
   * Generate a secret for 2FA
   */
  generateSecret(email: string, issuer: string = 'Aides on The Go'): string {
    return speakeasy.generateSecret({
      name: `${issuer} (${email})`,
      issuer: issuer,
      length: 32,
    }).base32;
  }

  /**
   * Verify a token against a secret
   */
  verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2, // Allow 2 time steps (1 minute each) for clock skew
    });
  }

  /**
   * Generate a QR code data URL for the secret
   */
  async generateQRCode(
    email: string,
    secret: string,
    issuer: string = 'Aides on The Go',
  ): Promise<string> {
    const otpAuthUrl = speakeasy.otpauthURL({
      secret: secret,
      label: email,
      issuer: issuer,
      encoding: 'base32',
    });

    try {
      return await QRCode.toDataURL(otpAuthUrl);
    } catch (err) {
      throw new Error('Failed to generate QR code');
    }
  }
}
