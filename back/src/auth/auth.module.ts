import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { DbService } from "../database/db.service";
import { getRequiredEnv } from "../config/env";

@Module({
	imports: [
		JwtModule.register({
			secret: getRequiredEnv("JWT_SECRET"),
			signOptions: { expiresIn: "7d" },
		}),
	],
	providers: [AuthService, DbService],
	controllers: [AuthController],
})
export class AuthModule {}
