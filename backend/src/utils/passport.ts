import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import crypto from "crypto";
import { withUnit } from "../db/unit";
import { UserService } from "../services/user-service";
import { SessionService } from "../services/session-service";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || "";
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || "";
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

export function configurePassport(): void {
    passport.serializeUser((user: any, done) => {
        done(null, user.userId);
    });

    passport.deserializeUser((userId: number, done) => {
        done(null, { userId });
    });

    if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
        passport.use(
            new GoogleStrategy(
                {
                    clientID: GOOGLE_CLIENT_ID,
                    clientSecret: GOOGLE_CLIENT_SECRET,
                    callbackURL: `${BASE_URL}/api/oauth/google/callback`,
                },
                async (_accessToken, _refreshToken, profile, done) => {
                    try {
                        const result = await handleOAuthLogin("google", profile);
                        done(null, result);
                    } catch (err) {
                        done(err as Error, false);
                    }
                }
            )
        );
    }

    if (GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET) {
        passport.use(
            new GitHubStrategy(
                {
                    clientID: GITHUB_CLIENT_ID,
                    clientSecret: GITHUB_CLIENT_SECRET,
                    callbackURL: `${BASE_URL}/api/oauth/github/callback`,
                },
                async (_accessToken: string, _refreshToken: string, profile: any, done: (err: Error | null, user?: any) => void) => {
                    try {
                        const result = await handleOAuthLogin("github", profile);
                        done(null, result);
                    } catch (err) {
                        done(err as Error, false);
                    }
                }
            )
        );
    }
}

async function handleOAuthLogin(
    provider: "google" | "github",
    profile: any
): Promise<{ userId: number; sessionId: string }> {
    return withUnit(false, async (unit) => {
        const userService = new UserService(unit);
        const sessionService = new SessionService(unit);

        const providerId = profile.id;
        const email = profile.emails?.[0]?.value || `${providerId}@${provider}.oauth`;
        const displayName = profile.displayName || profile.username || `User${providerId}`;

        let user = await userService.getByOAuth(provider, providerId);

        if (!user) {
            const existingByEmail = await userService.getByEmail(email);
            if (existingByEmail) {
                throw new Error("An account with this email already exists");
            }

            let username = displayName.replace(/\s+/g, "").toLowerCase();
            let counter = 1;
            while (await userService.getByUsername(username)) {
                username = `${displayName.replace(/\s+/g, "").toLowerCase()}${counter}`;
                counter++;
            }

            const userId = await userService.createOAuthUser(username, email, provider, providerId);
            user = await userService.getById(userId);
        }

        if (!user) {
            throw new Error("Failed to find or create user");
        }

        const sessionId = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const sessionCreated = await sessionService.createSession(sessionId, user.id, expiresAt);
        if (!sessionCreated) {
            throw new Error("Failed to create session");
        }

        return { userId: user.id, sessionId };
    });
}

export function isOAuthConfigured(provider: "google" | "github"): boolean {
    if (provider === "google") {
        return !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
    }
    if (provider === "github") {
        return !!(GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET);
    }
    return false;
}

export default passport;
