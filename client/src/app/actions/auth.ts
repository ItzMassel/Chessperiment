'use server';

import 'server-only';
import bcrypt from 'bcryptjs';
import { getUserByEmail, createUserWithPassword, setUserPasswordHash, createPasswordResetToken, consumePasswordResetToken, getUserById } from '@/db/users';

type ActionResult = { success: true } | { success: false; error: string };

export async function signUpAction(email: string, password: string, displayName?: string): Promise<ActionResult> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
        return { success: false, error: 'Email and password are required' };
    }
    if (password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters' };
    }

    try {
        const existing = await getUserByEmail(normalizedEmail);
        if (existing) {
            return { success: false, error: 'Email already in use' };
        }
        const passwordHash = await bcrypt.hash(password, 10);
        await createUserWithPassword(normalizedEmail, passwordHash, displayName?.trim() || null);
        return { success: true };
    } catch (error) {
        console.error('signUpAction error:', error);
        return { success: false, error: 'Failed to create account' };
    }
}

export async function requestPasswordResetAction(email: string): Promise<ActionResult> {
    const normalizedEmail = email.trim().toLowerCase();
    try {
        const user = await getUserByEmail(normalizedEmail);
        // Always return success regardless of whether the account exists, so this
        // can't be used to enumerate registered emails.
        if (!user) return { success: true };

        const token = await createPasswordResetToken(user.id);
        const origin = process.env.AUTH_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const resetUrl = `${origin}/reset-password?token=${token}`;

        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
            from: 'Chessperiment <onboarding@resend.dev>',
            to: [normalizedEmail],
            subject: 'Reset your Chessperiment password',
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333; line-height: 1.6;">
                    <h2>Reset your password</h2>
                    <p>Click the link below to choose a new password. This link expires in 1 hour.</p>
                    <p><a href="${resetUrl}" style="color: #d97706; font-weight: 600;">Reset password</a></p>
                    <p style="font-size: 0.8em; color: #666;">If you didn't request this, you can ignore this email.</p>
                </div>
            `,
        });
        return { success: true };
    } catch (error) {
        console.error('requestPasswordResetAction error:', error);
        // Still don't leak whether the account exists.
        return { success: true };
    }
}

export async function resetPasswordAction(token: string, newPassword: string): Promise<ActionResult> {
    if (!newPassword || newPassword.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters' };
    }
    try {
        const userId = await consumePasswordResetToken(token);
        if (!userId) {
            return { success: false, error: 'This reset link is invalid or has expired' };
        }
        const user = await getUserById(userId);
        if (!user) {
            return { success: false, error: 'Account no longer exists' };
        }
        const passwordHash = await bcrypt.hash(newPassword, 10);
        await setUserPasswordHash(userId, passwordHash);
        return { success: true };
    } catch (error) {
        console.error('resetPasswordAction error:', error);
        return { success: false, error: 'Failed to reset password' };
    }
}
