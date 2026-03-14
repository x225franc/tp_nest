import { Injectable } from "@nestjs/common";
import * as mysql from "mysql2/promise";
import { getRequiredEnv, getRequiredNumberEnv } from "../config/env";

@Injectable()
export class DbService {
	private pool: mysql.Pool;

	constructor() {
		this.pool = mysql.createPool({
			host: getRequiredEnv("DB_HOST"),
			port: getRequiredNumberEnv("DB_PORT"),
			user: getRequiredEnv("DB_USER"),
			password: getRequiredEnv("DB_PASSWORD"),
			database: getRequiredEnv("DB_NAME"),
			waitForConnections: true,
			connectionLimit: 10,
			queueLimit: 0,
		});
	}

	async query(sql: string, values?: any[]) {
		const connection = await this.pool.getConnection();
		try {
			const [results] = await connection.execute(sql, values || []);
			return results;
		} finally {
			connection.release();
		}
	}
}
