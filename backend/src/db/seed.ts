import { Unit } from "./unit";

export async function ensureSampleDataInserted(unit: Unit): Promise<void> {
    const existing = await unit.querySingle<{ cnt: number }>(
        `SELECT COUNT(*)::int AS cnt FROM users WHERE username = 'demo'`
    );

    if (existing && existing.cnt > 0) {
        return;
    }

    await unit.query(
        `INSERT INTO users (username, email, password_hash, created_at)
         VALUES ($1, $2, $3, NOW())`,
        ["demo", "demo@lifetracker.app", "demo123"]
    );

    console.log("✅ Demo user inserted (demo / demo123)");
}
