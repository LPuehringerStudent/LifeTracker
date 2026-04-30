import bcrypt from "bcryptjs";
import { ServiceBase } from "./service-base";
import { Unit } from "../db/unit";

export interface UserRow {
    id: number;
    username: string;
    email: string;
    password_hash: string;
    created_at: string;
}

const SALT_ROUNDS = 12;

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

    async getByOAuth(provider: string, providerId: string): Promise<Omit<UserRow, "password_hash"> | null> {
        return this.unit.querySingle<Omit<UserRow, "password_hash">>(
            `SELECT id, username, email, created_at FROM users WHERE provider = $1 AND provider_id = $2`,
            [provider, providerId]
        );
    }

    async createUser(username: string, email: string, plainPassword: string): Promise<number> {
        const hash = await bcrypt.hash(plainPassword, SALT_ROUNDS);
        const result = await this.unit.query<{ id: number }>(
            `INSERT INTO users (username, email, password_hash, created_at)
             VALUES ($1, $2, $3, NOW())
             RETURNING id`,
            [username, email, hash]
        );
        return result.rows[0].id;
    }

    async createOAuthUser(username: string, email: string, provider: string, providerId: string): Promise<number> {
        const result = await this.unit.query<{ id: number }>(
            `INSERT INTO users (username, email, provider, provider_id, created_at)
             VALUES ($1, $2, $3, $4, NOW())
             RETURNING id`,
            [username, email, provider, providerId]
        );
        return result.rows[0].id;
    }

    async verifyPassword(plainPassword: string, hash: string): Promise<boolean> {
        return bcrypt.compare(plainPassword, hash);
    }

    async updateEmail(id: number, email: string): Promise<boolean> {
        const result = await this.unit.query(
            `UPDATE users SET email = $1 WHERE id = $2`,
            [email, id]
        );
        return result.rowCount === 1;
    }

    async updatePassword(id: number, plainPassword: string): Promise<boolean> {
        const hash = await bcrypt.hash(plainPassword, SALT_ROUNDS);
        const result = await this.unit.query(
            `UPDATE users SET password_hash = $1 WHERE id = $2`,
            [hash, id]
        );
        return result.rowCount === 1;
    }
}
