import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback",
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0].value;

          if (!email) {
            return done(new Error("No email found"), undefined);
          }

          const existing = await db
            .select()
            .from(users)
            .where(eq(users.email, email));

          if (existing.length > 0) {
            return done(null, existing[0]);
          }

          const newUser = await db
            .insert(users)
            .values({
              email,
              password: "google-auth",
              role: "Lab Assistant",
              isApproved: "false",
              name: profile.displayName,
            })
            .returning();

          done(null, newUser[0]);
        } catch (err) {
          done(err, undefined);
        }
      }
    )
  );
}

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export default passport;