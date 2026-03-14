import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { DbService } from "../database/db.service";
import { SignupDto } from "./dto/signup.dto";
import { SigninDto } from "./dto/signin.dto";
import { UpdateProfileDto } from "./dto/updateProfile.dto";
import * as bcrypt from "bcryptjs";

@Injectable()
export class AuthService {
	constructor(
		private db: DbService,
		private jwtService: JwtService,
	) {}

	async signup(dto: SignupDto) {
		const existing = await this.db.query(
			"SELECT id FROM users WHERE email = ? OR username = ?",
			[dto.email, dto.username],
		);
		if (Array.isArray(existing) && existing.length > 0) {
			throw new Error("L'utilisateur existe déjà");
		}
		const hash = await bcrypt.hash(dto.password, 10);
		const result = await this.db.query(
			"INSERT INTO users (username, email, passwordHash) VALUES (?, ?, ?)",
			[dto.username, dto.email, hash],
		);
		const userId = (result as any).insertId;
		const user = {
			id: userId,
			username: dto.username,
			email: dto.email,
			customColor: "#ffffff",
		};
		return user;
	}

	async signin(dto: SigninDto) {
		const results = await this.db.query("SELECT * FROM users WHERE email = ?", [
			dto.email,
		]);
		if (!Array.isArray(results) || results.length === 0) {
			throw new Error("Identifiants invalides");
		}
		const user = results[0] as any;
		const userRecord = await this.db.query(
			"SELECT passwordHash FROM users WHERE id = ?",
			[user.id],
		);
		const ok = await bcrypt.compare(
			dto.password,
			(userRecord as any)[0].passwordHash,
		);
		if (!ok) throw new Error("Identifiants invalides");
		const token = this.jwtService.sign({ sub: user.id, ...user });
		return { ...user, token };
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
}
