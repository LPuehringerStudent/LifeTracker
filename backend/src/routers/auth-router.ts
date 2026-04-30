import express from "express";
import crypto from "crypto";
import { StatusCodes } from "http-status-codes";
import { isNullOrWhiteSpace } from "../utils/util";
import { withUnit, withReadOnlyUnit } from "../db/unit";
import { UserService } from "../services/user-service";
import { SessionService } from "../services/session-service";

export const authRouter = express.Router();

authRouter.post("/auth/register", async (req, res) => {
    const { username, password, email } = req.body;

    if (isNullOrWhiteSpace(username) || isNullOrWhiteSpace(password) || isNullOrWhiteSpace(email)) {
        res.status(StatusCodes.BAD_REQUEST).json({ error: "Username, password, and email are required" });
        return;
    }

    if (password.length < 6) {
        res.status(StatusCodes.BAD_REQUEST).json({ error: "Password must be at least 6 characters" });
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        res.status(StatusCodes.BAD_REQUEST).json({ error: "Invalid email format" });
        return;
    }

    try {
        const result = await withUnit(false, async (unit) => {
            const userService = new UserService(unit);
            const sessionService = new SessionService(unit);

            const existingByUsername = await userService.getByUsername(username);
            if (existingByUsername) {
                throw { status: StatusCodes.CONFLICT, message: "Username already exists" };
            }

            const existingByEmail = await userService.getByEmail(email);
            if (existingByEmail) {
                throw { status: StatusCodes.CONFLICT, message: "Email already exists" };
            }

            const userId = await userService.createUser(username, email, password);

            const sessionId = crypto.randomUUID();
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24);

            const sessionCreated = await sessionService.createSession(sessionId, userId, expiresAt);
            if (!sessionCreated) {
                throw { status: StatusCodes.INTERNAL_SERVER_ERROR, message: "Failed to create session" };
            }

            return { sessionId, userId };
        });

        res.status(StatusCodes.CREATED).json(result);
    } catch (err: any) {
        if (err.status) {
            res.status(err.status).json({ error: err.message });
        } else {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: String(err) });
        }
    }
});

authRouter.post("/auth/login", async (req, res) => {
    const { usernameOrEmail, password } = req.body;

    if (isNullOrWhiteSpace(usernameOrEmail) || isNullOrWhiteSpace(password)) {
        res.status(StatusCodes.BAD_REQUEST).json({ error: "Username/email and password are required" });
        return;
    }

    try {
        const result = await withUnit(false, async (unit) => {
            const userService = new UserService(unit);
            const sessionService = new SessionService(unit);

            let user = await userService.getByUsername(usernameOrEmail);
            if (!user) {
                user = await userService.getByEmail(usernameOrEmail);
            }

            if (!user || !(await userService.verifyPassword(password, user.password_hash))) {
                throw { status: StatusCodes.UNAUTHORIZED, message: "Invalid username/email or password" };
            }

            const sessionId = crypto.randomUUID();
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24);

            const success = await sessionService.createSession(sessionId, user.id, expiresAt);
            if (!success) {
                throw { status: StatusCodes.INTERNAL_SERVER_ERROR, message: "Failed to create session" };
            }

            return { sessionId, userId: user.id };
        });

        res.status(StatusCodes.OK).json(result);
    } catch (err: any) {
        if (err.status) {
            res.status(err.status).json({ error: err.message });
        } else {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: String(err) });
        }
    }
});

authRouter.get("/auth/me", async (req, res) => {
    const sessionId = req.headers["session-id"] as string;
    if (!sessionId) {
        res.status(StatusCodes.BAD_REQUEST).json({ error: "Missing session-id header" });
        return;
    }

    try {
        const user = await withReadOnlyUnit(async (unit) => {
            const sessionService = new SessionService(unit);
            const userService = new UserService(unit);

            const session = await sessionService.getSession(sessionId);
            if (!session) {
                throw { status: StatusCodes.UNAUTHORIZED, message: "Invalid or expired session" };
            }

            if (new Date(session.expires_at) < new Date()) {
                throw { status: StatusCodes.UNAUTHORIZED, message: "Session expired" };
            }

            const player = await userService.getById(session.user_id);
            if (!player) {
                throw { status: StatusCodes.NOT_FOUND, message: "User not found" };
            }

            return player;
        });

        res.status(StatusCodes.OK).json(user);
    } catch (err: any) {
        if (err.status) {
            res.status(err.status).json({ error: err.message });
        } else {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: String(err) });
        }
    }
});

authRouter.post("/auth/logout", async (req, res) => {
    const sessionId = req.headers["session-id"] as string;
    if (!sessionId) {
        res.status(StatusCodes.BAD_REQUEST).json({ error: "Missing session-id header" });
        return;
    }

    try {
        await withUnit(false, async (unit) => {
            const sessionService = new SessionService(unit);
            const session = await sessionService.getSession(sessionId);
            if (!session) {
                throw { status: StatusCodes.UNAUTHORIZED, message: "Invalid or inactive session" };
            }

            const success = await sessionService.invalidateSession(sessionId);
            if (!success) {
                throw { status: StatusCodes.INTERNAL_SERVER_ERROR, message: "Failed to invalidate session" };
            }
        });

        res.status(StatusCodes.OK).json({ message: "Logout successful" });
    } catch (err: any) {
        if (err.status) {
            res.status(err.status).json({ error: err.message });
        } else {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: String(err) });
        }
    }
});
