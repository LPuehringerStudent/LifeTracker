import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";
import path from "path";
import { authRouter } from "./routers/auth-router";
import { ensureTablesCreated } from "./db/schema";
import { ensureSampleDataInserted } from "./db/seed";
import { Unit } from "./db/unit";

export const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", authRouter);

app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/db-test", async (_req, res) => {
    const unit = new Unit(true);
    try {
        await unit.init();
        const result = await unit.query<{ count: number }>("SELECT COUNT(*)::int as count FROM information_schema.tables WHERE table_schema = 'public'");
        await unit.complete();
        res.json({ status: "connected", tables: result.rows[0]?.count ?? 0 });
    } catch (error) {
        await unit.complete(false).catch(() => {});
        res.status(500).json({ status: "error", message: String(error) });
    }
});

app.use(express.static(path.join(process.cwd(), "frontend", "dist", "lifetracker-frontend", "browser")));

app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
        next();
        return;
    }
    res.sendFile(path.join(process.cwd(), "frontend", "dist", "lifetracker-frontend", "browser", "index.html"));
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 LifeTracker server running on http://localhost:${PORT}`);
        initDb().catch(console.error);
    });
}

async function initDb(): Promise<void> {
    const unit = new Unit(false);
    try {
        await unit.init();
        await ensureTablesCreated(unit);
        console.log("✅ Tables ensured");
        await ensureSampleDataInserted(unit);
        await unit.complete(true);
    } catch (error) {
        console.error("Database initialization failed:", error);
        await unit.complete(false).catch(() => {});
    }
}
