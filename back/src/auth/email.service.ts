import { Injectable } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import { getRequiredEnv, getRequiredNumberEnv } from "../config/env";

@Injectable()
export class EmailService {
	private transporter: nodemailer.Transporter;

	constructor() {
		this.transporter = nodemailer.createTransport({
			host: getRequiredEnv("MAIL_HOST"),
			port: getRequiredNumberEnv("MAIL_PORT"),
			secure: false,
			auth: {
				user: getRequiredEnv("MAIL_USER"),
				pass: getRequiredEnv("MAIL_PASS"),
			},
		});
	}

	async sendVerificationEmail(
		email: string,
		token: string,
		username: string,
	): Promise<void> {
		const verificationLink = `${getRequiredEnv("FRONTEND_URL")}/verify-email?token=${token}`;

		const mailOptions = {
			from: getRequiredEnv("MAIL_FROM"),
			to: email,
			subject: "Vérifiez votre adresse email",
			html: `
        <h2>Bienvenue ${username}</h2>
        <p>Cliquez sur le lien ci-dessous pour vérifier votre adresse email:</p>
        <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;"> Vérifier mon email </a>`,
		};

		await this.transporter.sendMail(mailOptions);
	}

	async sendPasswordResetEmail(
		email: string,
		token: string,
		username: string,
	): Promise<void> {
		const resetLink = `${getRequiredEnv("FRONTEND_URL")}/reset-password?token=${token}`;

		const mailOptions = {
			from: getRequiredEnv("MAIL_FROM"),
			to: email,
			subject: "Réinitialiser votre mot de passe",
			html: `
        <h2>Réinitialiser le mot de passe</h2>
        <p>Bonjour ${username},</p>
        <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe:</p>
        <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Réinitialiser mon mot de passe</a>
        <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>`,
		};

		await this.transporter.sendMail(mailOptions);
	}

	async send2FACode(
		email: string,
		code: string,
		username: string,
	): Promise<void> {
		const mailOptions = {
			from: getRequiredEnv("MAIL_FROM"),
			to: email,
			subject: "Votre code de vérification 2FA",
			html: `
        <h2>Authentification à 2 facteurs</h2>
        <p>Bonjour ${username},</p>
        <p>Voici votre code de vérification:</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${code}</p>`,
		};

		await this.transporter.sendMail(mailOptions);
	}
}
