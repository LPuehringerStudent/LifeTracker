import { ServiceBase } from "./service-base";
import { Unit } from "../db/unit";

export interface UserRow {
    id: number;
    username: string;
    email: string;
    password_hash: string;
    created_at: string;
}

export class UserService extends ServiceBase {
    constructor(unit: Unit) {
        super(unit);
    }

    async getByUsername(username: string): Promise<UserRow | null> {
        return this.unit.querySingle<UserRow>(
            `SELECT id, username, email, password_hash, created_at FROM users WHERE username = $1`,
            [username]
        );
    }

    async getByEmail(email: string): Promise<UserRow | null> {
        return this.unit.querySingle<UserRow>(
            `SELECT id, username, email, password_hash, created_at FROM users WHERE email = $1`,
            [email]
        );
    }

    async getById(id: number): Promise<Omit<UserRow, "password_hash"> | null> {
        return this.unit.querySingle<Omit<UserRow, "password_hash">>(
            `SELECT id, username, email, created_at FROM users WHERE id = $1`,
            [id]
        );
    }

    async createUser(username: string, email: string, passwordHash: string): Promise<number> {
        const result = await this.unit.query<{ id: number }>(
            `INSERT INTO users (username, email, password_hash, created_at)
             VALUES ($1, $2, $3, NOW())
             RETURNING id`,
            [username, email, passwordHash]
        );
        return result.rows[0].id;
    }

    async updateEmail(id: number, email: string): Promise<boolean> {
        const result = await this.unit.query(
            `UPDATE users SET email = $1 WHERE id = $2`,
            [email, id]
        );
        return result.rowCount === 1;
    }

    async updatePassword(id: number, passwordHash: string): Promise<boolean> {
        const result = await this.unit.query(
            `UPDATE users SET password_hash = $1 WHERE id = $2`,
            [passwordHash, id]
        );
        return result.rowCount === 1;
    }
}
