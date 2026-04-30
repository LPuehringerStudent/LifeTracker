import express from "express";
import passport, { isOAuthConfigured } from "../utils/passport";

export const oauthRouter = express.Router();

oauthRouter.get("/oauth/google", (req, res, next) => {
    if (!isOAuthConfigured("google")) {
        res.status(501).json({ error: "Google OAuth not configured" });
        return;
    }
    passport.authenticate("google", {
        scope: ["profile", "email"],
    })(req, res, next);
});

oauthRouter.get("/oauth/google/callback", (req, res, next) => {
    if (!isOAuthConfigured("google")) {
        res.status(501).json({ error: "Google OAuth not configured" });
        return;
    }
    passport.authenticate("google", { session: false }, (err: Error | null, user: any) => {
        if (err) {
            console.error("Google OAuth error:", err);
            res.redirect(`/login?error=${encodeURIComponent(err.message)}`);
            return;
        }
        if (!user) {
            res.redirect("/login?error=Authentication failed");
            return;
        }
        res.redirect(`/oauth/callback?sessionId=${user.sessionId}&userId=${user.userId}`);
    })(req, res, next);
});

oauthRouter.get("/oauth/github", (req, res, next) => {
    if (!isOAuthConfigured("github")) {
        res.status(501).json({ error: "GitHub OAuth not configured" });
        return;
    }
    passport.authenticate("github", {
        scope: ["user:email"],
    })(req, res, next);
});

oauthRouter.get("/oauth/github/callback", (req, res, next) => {
    if (!isOAuthConfigured("github")) {
        res.status(501).json({ error: "GitHub OAuth not configured" });
        return;
    }
    passport.authenticate("github", { session: false }, (err: Error | null, user: any) => {
        if (err) {
            console.error("GitHub OAuth error:", err);
            res.redirect(`/login?error=${encodeURIComponent(err.message)}`);
            return;
        }
        if (!user) {
            res.redirect("/login?error=Authentication failed");
            return;
        }
        res.redirect(`/oauth/callback?sessionId=${user.sessionId}&userId=${user.userId}`);
    })(req, res, next);
});

oauthRouter.get("/oauth/status", (_req, res) => {
    res.json({
        google: isOAuthConfigured("google"),
        github: isOAuthConfigured("github"),
    });
});
