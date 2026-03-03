import { Injectable } from '@nestjs/common';
import * as mysql from 'mysql2/promise';

@Injectable()
export class DbService {
    private pool: mysql.Pool;

    constructor() {
        this.pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER || 'tp_nest_user',
            password: process.env.DB_PASSWORD || 'motdepassedefou123',
            database: process.env.DB_NAME || 'tp_nest',
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
