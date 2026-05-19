import { Injectable } from '@nestjs/common';

/**
 * Password Generation Service
 * Generates strong temporary passwords that comply with security requirements
 */
@Injectable()
export class PasswordService {
  /**
   * Generate a temporary password
   * Format: CapitalLetter + lowercase + number + special + random chars
   * Example: Hr@4821Xp (8 characters, strong entropy)
   * 
   * Requirements:
   * - Uppercase: A-Z
   * - Lowercase: a-z
   * - Numbers: 0-9
   * - Special: @#$%&
   * - Total: 8-10 characters
   */
  generateTemporary(): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '@#$%&';

    // Start with at least one of each required character type
    const chars: string[] = [
      uppercase[Math.floor(Math.random() * uppercase.length)],
      lowercase[Math.floor(Math.random() * lowercase.length)],
      numbers[Math.floor(Math.random() * numbers.length)],
      special[Math.floor(Math.random() * special.length)],
    ];

    // Add 4-6 more random characters for strength
    const all = uppercase + lowercase + numbers;
    const additionalChars = Math.floor(Math.random() * 3) + 4; // 4-6 chars
    
    for (let i = 0; i < additionalChars; i++) {
      chars.push(all[Math.floor(Math.random() * all.length)]);
    }

    // Shuffle to avoid predictable patterns
    return chars.sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Validate password strength
   * Requirements: 8+ chars, uppercase, lowercase, number, special
   */
  validateStrength(password: string): boolean {
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    if (!/[@#$%&!]/.test(password)) return false;
    return true;
  }

  /**
   * Hash password with bcrypt
   * Note: bcrypt import should be added
   */
  async hash(password: string): Promise<string> {
    // This will be implemented with actual bcrypt import
    // import * as bcrypt from 'bcrypt';
    // return bcrypt.hash(password, 10);
    
    // For now, returning placeholder
    throw new Error('Implement bcrypt.hash in actual service');
  }

  /**
   * Compare password with hash
   */
  async compare(password: string, hash: string): Promise<boolean> {
    // return bcrypt.compare(password, hash);
    throw new Error('Implement bcrypt.compare in actual service');
  }
}
