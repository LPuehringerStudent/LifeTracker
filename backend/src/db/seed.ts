import { Unit } from "./unit";

export async function ensureSampleDataInserted(unit: Unit): Promise<void> {
    const existing = await unit.querySingle<{ cnt: number }>(
        `SELECT COUNT(*)::int AS cnt FROM users WHERE username = 'demo'`
    );

    if (existing && existing.cnt > 0) {
        return;
    }

    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.default.hash("demo123", 12);

    await unit.query(
        `INSERT INTO users (username, email, password_hash, created_at)
         VALUES ($1, $2, $3, NOW())`,
        ["demo", "demo@lifetracker.app", hash]
    );

    console.log("✅ Demo user inserted (demo / demo123)");
}
