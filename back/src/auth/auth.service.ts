import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { DbService } from "../database/db.service";
import { SignupDto } from "./dto/signup.dto";
import { SigninDto } from "./dto/signin.dto";
import { UpdateProfileDto } from "./dto/updateProfile.dto";
import { VerifyEmailDto } from "./dto/verifyEmail.dto";
import { ForgotPasswordDto } from "./dto/forgotPassword.dto";
import { ResetPasswordDto } from "./dto/resetPassword.dto";
import { ChangePasswordDto } from "./dto/changePassword.dto";
import { EmailService } from "./email.service";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";

@Injectable()
export class AuthService {
	constructor(
		private db: DbService,
		private jwtService: JwtService,
		private emailService: EmailService,
	) {}

	private generateToken(): string {
		return crypto.randomBytes(32).toString("hex");
	}

	private generateShortCode(): string {
		return Math.random().toString(36).substring(2, 8).toUpperCase();
	}

	async signup(dto: SignupDto) {
		const existing = await this.db.query(
			"SELECT id FROM users WHERE email = ? OR username = ?",
			[dto.email, dto.username],
		);
		if (Array.isArray(existing) && existing.length > 0) {
			throw new Error("Utilisateur existe déjà");
		}

		const hash = await bcrypt.hash(dto.password, 10);
		const emailToken = this.generateToken();

		const result = await this.db.query(
			"INSERT INTO users (username, email, passwordHash, emailToken, emailVerified) VALUES (?, ?, ?, ?, 0)",
			[dto.username, dto.email, hash, emailToken],
		);

		const userId = (result as any).insertId;

		try {
			await this.emailService.sendVerificationEmail(
				dto.email,
				emailToken,
				dto.username,
			);
		} catch (error) {
			console.error("Erreur d'envoi email:", error);
		}

		const user = {
			id: userId,
			username: dto.username,
			email: dto.email,
			customColor: "#ffffff",
			emailVerified: false,
		};
		return {
			...user,
			message: "Inscription réussie. vérifier votre email.",
		};
	}

	async verifyEmail(dto: VerifyEmailDto) {
		const results = await this.db.query(
			"SELECT * FROM users WHERE emailToken = ?",
			[dto.token],
		);

		if (!Array.isArray(results) || results.length === 0) {
			throw new Error("Token invalide");
		}

		const user = results[0] as any;

		await this.db.query(
			"UPDATE users SET emailVerified = 1, emailToken = NULL WHERE id = ?",
			[user.id],
		);

		return {
			message: "Email vérifié.",
			user: {
				id: user.id,
				username: user.username,
				email: user.email,
			},
		};
	}

	async signin(dto: SigninDto) {
		const results = await this.db.query("SELECT * FROM users WHERE email = ?", [
			dto.email,
		]);
		if (!Array.isArray(results) || results.length === 0) {
			throw new Error("Identifiants invalides");
		}

		const user = results[0] as any;

		if (!user.emailVerified) {
			throw new Error("vérifier votre email");
		}

		const userRecord = await this.db.query(
			"SELECT passwordHash FROM users WHERE id = ?",
			[user.id],
		);

		const ok = await bcrypt.compare(
			dto.password,
			(userRecord as any)[0].passwordHash,
		);
		if (!ok) throw new Error("Identifiants invalides");

		if (user.twoFactorEnabled) {
			const twoFactorSecret = this.generateShortCode();
			await this.db.query(
				"UPDATE users SET twoFactorSecret = ? WHERE id = ?",
				[twoFactorSecret, user.id],
			);

			try {
				await this.emailService.send2FACode(
					user.email,
					twoFactorSecret,
					user.username,
				);
			} catch (error) {
				console.error("Erreur lors de l'envoi de l'email 2FA:", error);
			}

			return {
				status: "2FA_REQUIRED",
				userId: user.id,
				message: "Code de vérification envoyé par email",
			};
		}

		const token = this.jwtService.sign({ sub: user.id, ...user });
		return { ...user, token };
	}

	async forgotPassword(dto: ForgotPasswordDto) {
		const results = await this.db.query("SELECT * FROM users WHERE email = ?", [
			dto.email,
		]);

		if (!Array.isArray(results) || results.length === 0) {
			return {
				message:
					"Si cet email existe, un lien de réinitialisation a été envoyé.",
			};
		}

		const user = results[0] as any;
		const resetToken = this.generateToken();

		await this.db.query(
			"UPDATE users SET passwordResetToken = ? WHERE id = ?",
			[resetToken, user.id],
		);

		try {
			await this.emailService.sendPasswordResetEmail(
				dto.email,
				resetToken,
				user.username,
			);
		} catch (error) {
			console.error("Erreur lors de l'envoi de l'email:", error);
		}

		return {
			message: "Si cet email existe, un lien de réinitialisation a été envoyé.",
		};
	}

	async validateResetToken(token: string) {
		const results = await this.db.query(
			"SELECT id FROM users WHERE passwordResetToken = ?",
			[token],
		);

		if (!Array.isArray(results) || results.length === 0) {
			throw new Error("Token invalide");
		}

		return { valid: true };
	}

	async resetPassword(dto: ResetPasswordDto) {
		const results = await this.db.query(
			"SELECT * FROM users WHERE passwordResetToken = ?",
			[dto.token],
		);

		if (!Array.isArray(results) || results.length === 0) {
			throw new Error("Token invalide");
		}

		const user = results[0] as any;
		const hash = await bcrypt.hash(dto.newPassword, 10);

		await this.db.query(
			"UPDATE users SET passwordHash = ?, passwordResetToken = NULL WHERE id = ?",
			[hash, user.id],
		);

		return {
			message: "Mot de passe réinitialisé.",
		};
	}

	async changePassword(userId: number, dto: ChangePasswordDto) {
		const userRecord = await this.db.query(
			"SELECT passwordHash FROM users WHERE id = ?",
			[userId],
		);

		if (!Array.isArray(userRecord) || userRecord.length === 0) {
			throw new Error("Utilisateur non trouvé");
		}

		const ok = await bcrypt.compare(
			dto.oldPassword,
			(userRecord as any)[0].passwordHash,
		);

		if (!ok) {
			throw new Error("Ancien mot de passe incorrect");
		}

		const hash = await bcrypt.hash(dto.newPassword, 10);
		await this.db.query("UPDATE users SET passwordHash = ? WHERE id = ?", [
			hash,
			userId,
		]);

		return { message: "Mot de passe changé." };
	}

	async updateProfile(userId: number, dto: UpdateProfileDto) {
		if (dto.username) {
			const existing = await this.db.query(
				"SELECT id FROM users WHERE username = ? AND id != ?",
				[dto.username, userId],
			);
			if (Array.isArray(existing) && existing.length > 0) {
				throw new Error("Nom d'utilisateur est déjà pris");
			}
		}
		const updates: string[] = [];
		const values: any[] = [];
		if (dto.username) {
			updates.push("username = ?");
			values.push(dto.username);
		}
		if (dto.customColor) {
			updates.push("customColor = ?");
			values.push(dto.customColor);
		}
		if (updates.length === 0) {
			throw new Error("Aucune modification à appliquer");
		}
		values.push(userId);
		await this.db.query(
			`UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
			values,
		);
		const result = await this.db.query("SELECT * FROM users WHERE id = ?", [
			userId,
		]);
		return (result as any)[0];
	}

	async enable2FA(userId: number, dto: any) {
		await this.db.query(
			"UPDATE users SET twoFactorEnabled = 1 WHERE id = ?",
			[userId],
		);
		return { message: "L'authentification à 2 facteurs est activée" };
	}

	async disable2FA(userId: number) {
		await this.db.query(
			"UPDATE users SET twoFactorEnabled = 0, twoFactorSecret = NULL WHERE id = ?",
			[userId],
		);
		return { message: "L'authentification à 2 facteurs est désactivée" };
	}

	async verify2FA(code: string, userId: number) {
		const results = await this.db.query(
			"SELECT twoFactorSecret FROM users WHERE id = ?",
			[userId],
		);

		if (!Array.isArray(results) || results.length === 0) {
			throw new Error("Utilisateur non trouvé");
		}

		const user = results[0] as any;
		if (user.twoFactorSecret !== code) {
			throw new Error("Code 2FA invalide");
		}

		await this.db.query(
			"UPDATE users SET twoFactorSecret = NULL WHERE id = ?",
			[userId],
		);

		return { success: true, message: "Authentification 2FA réussie" };
	}

	async signin2FAVerified(userId: number) {
		const results = await this.db.query(
			"SELECT * FROM users WHERE id = ?",
			[userId],
		);

		if (!Array.isArray(results) || results.length === 0) {
			throw new Error("Utilisateur non trouvé");
		}

		const user = results[0] as any;
		const token = this.jwtService.sign({ sub: user.id, ...user });
		return { ...user, token };
	}
}
