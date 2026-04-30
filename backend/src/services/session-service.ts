import { ServiceBase } from "./service-base";
import { Unit } from "../db/unit";

export interface SessionRow {
    session_id: string;
    user_id: number;
    created_at: string;
    expires_at: string;
    is_active: boolean;
}

export class SessionService extends ServiceBase {
    constructor(unit: Unit) {
        super(unit);
    }

    async createSession(sessionId: string, userId: number, expiresAt: Date): Promise<boolean> {
        const result = await this.unit.query(
            `INSERT INTO sessions (session_id, user_id, expires_at, is_active)
             VALUES ($1, $2, $3, TRUE)`,
            [sessionId, userId, expiresAt.toISOString()]
        );
        return result.rowCount === 1;
    }

    async getSession(sessionId: string): Promise<SessionRow | null> {
        return this.unit.querySingle<SessionRow>(
            `SELECT session_id, user_id, created_at, expires_at, is_active
             FROM sessions
             WHERE session_id = $1 AND is_active = TRUE`,
            [sessionId]
        );
    }

    async invalidateSession(sessionId: string): Promise<boolean> {
        const result = await this.unit.query(
            `UPDATE sessions SET is_active = FALSE WHERE session_id = $1`,
            [sessionId]
        );
        return result.rowCount === 1;
    }
}
