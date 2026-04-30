import { Pool, PoolClient, QueryResultRow } from "pg";

const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    database: process.env.DB_NAME || "lifetracker",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
});

export class Unit {
    private client: PoolClient | null = null;
    private completed = false;

    constructor(public readonly readOnly: boolean) {}

    async init(): Promise<void> {
        this.client = await pool.connect();
        if (!this.readOnly) {
            await this.client.query("BEGIN");
        }
    }

    async query<T extends QueryResultRow = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: T[]; rowCount: number }> {
        if (!this.client) {
            throw new Error("Unit not initialized. Call init() first.");
        }
        const result = await this.client.query<T>(sql, params);
        return { rows: result.rows, rowCount: result.rowCount ?? 0 };
    }

    async querySingle<T extends QueryResultRow = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | null> {
        const result = await this.query<T>(sql, params);
        return result.rows[0] ?? null;
    }

    async complete(commit: boolean | null = null): Promise<void> {
        if (this.completed || !this.client) {
            return;
        }
        this.completed = true;

        try {
            if (commit !== null) {
                if (commit) {
                    await this.client.query("COMMIT");
                } else {
                    await this.client.query("ROLLBACK");
                }
            } else if (!this.readOnly) {
                throw new Error("Transaction requires commit or rollback decision.");
            }
        } finally {
            this.client.release();
            this.client = null;
        }
    }
}

export async function withUnit<T>(readOnly: boolean, fn: (unit: Unit) => Promise<T>): Promise<T> {
    const unit = new Unit(readOnly);
    await unit.init();
    try {
        const result = await fn(unit);
        await unit.complete(true);
        return result;
    } catch (err) {
        await unit.complete(false);
        throw err;
    }
}

export async function withReadOnlyUnit<T>(fn: (unit: Unit) => Promise<T>): Promise<T> {
    const unit = new Unit(true);
    await unit.init();
    try {
        const result = await fn(unit);
        await unit.complete();
        return result;
    } catch (err) {
        await unit.complete(false);
        throw err;
    }
}
