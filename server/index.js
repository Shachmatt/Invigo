import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

const db = new pg.Pool({
    host: process.env.PGHOST,
    port: process.env.PGPORT || 5432,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl: process.env.PGSSLMODE ? { rejectUnauthorized: false } : undefined,
    max: 5,
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Enable CORS for React app
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});


const JWT_SECRET = process.env.JWT_SECRET || "your_fallback_super_secret_key";

// Google OAuth — the WEB client ID is the audience the mobile idToken is signed for.
const GOOGLE_WEB_CLIENT_ID = process.env.GOOGLE_WEB_CLIENT_ID;
const googleClient = new OAuth2Client();

// Email via Resend's HTTPS API (port 443) — works on Render free tier, unlike SMTP.
const RESEND_API_KEY = process.env.RESEND_API_KEY;
// Must be a verified sender. Use "onboarding@resend.dev" for testing, or your own
// verified domain in production. Override with the RESEND_FROM env var.
const RESEND_FROM = process.env.RESEND_FROM || "InvestiGO <onboarding@resend.dev>";

async function sendResetEmail(to, code) {
    if (!RESEND_API_KEY) {
        throw new Error("RESEND_API_KEY env var is not set");
    }

    const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from: RESEND_FROM,
            to: [to],
            subject: "Obnovení hesla — InvestiGO",
            text: `Tvůj ověřovací kód pro obnovení hesla je: ${code}\n\nKód platí 15 minut. Pokud jsi o obnovení nežádal/a, tento e-mail ignoruj.`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
                  <h2 style="color: #4b2e2e;">Obnovení hesla</h2>
                  <p>Tvůj ověřovací kód je:</p>
                  <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #4b2e2e;">${code}</p>
                  <p style="color: #666;">Kód platí 15 minut. Pokud jsi o obnovení nežádal/a, tento e-mail ignoruj.</p>
                </div>`,
        }),
    });

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Resend API error ${res.status}: ${body}`);
    }
}

// Ensure a unique value for the NOT-NULL/unique `name` column when creating Google users.
async function uniqueName(base) {
    let candidate = (base || "user").trim() || "user";
    for (let i = 0; i < 5; i++) {
        const taken = await db.query(`SELECT 1 FROM users WHERE name = $1`, [candidate]);
        if (taken.rows.length === 0) return candidate;
        candidate = `${base}_${Math.random().toString(36).slice(2, 6)}`;
    }
    return `${base}_${Date.now()}`;
}


const authenticateToken = (req, res, next) => {
    // Look for the token in the Authorization header
    const authHeader = req.headers['authorization'];
    // Headers usually look like: "Bearer YOUR_JWT_TOKEN", so we split it
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    try {
        // Verify the token using your JWT secret key
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // This contains { userId: X, username: Y } that you signed during login
        next(); // Pass control to the next endpoint function
    } catch (err) {
        return res.status(403).json({ error: "Invalid or expired token." });
    }
};



const verifyAndResetDailyHearts = async (req, res, next) => {
    try {
        // req.user.userId is available because 'authenticateToken' ran right before this!
        const userId = req.user.userId;

        // 1. Fetch the user's current heart count and the last time their hearts were tracked
        const userCheck = await db.query(
            `SELECT hearts, datehearts FROM users WHERE id = $1`,
            [userId]
        );

        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: "User context not found" });
        }

        const user = userCheck.rows[0];
        
        // 2. Format dates to compare calendar days (ignoring local hours/minutes/seconds)
        const now = new Date();
        const todayMidnightUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
        const lastResetDate = new Date(user.datehearts).toISOString();

        // 3. If today is a completely fresh calendar day, reset their hearts
        if (lastResetDate < todayMidnightUTC) {
            console.log(`Resetting hearts to 3 for User ID: ${userId}. New day detected.`);
            
            await db.query(
                `UPDATE users
                 SET hearts = 3, datehearts = $1
                 WHERE id = $2`,
                [todayMidnightUTC, userId]
            );
        }

        // Streak upkeep. last_active within 1 day (today/yesterday) = streak alive.
        // If days were missed, spend streak freezers to cover them (1 freezer = 1 day);
        // if there are enough freezers we keep the streak and treat the user as active
        // yesterday, otherwise the streak breaks and resets to 0.
        await db.query(
            `UPDATE users
             SET
               streak = CASE
                   WHEN last_active IS NULL THEN streak
                   WHEN CURRENT_DATE - last_active <= 1 THEN streak
                   WHEN COALESCE(streak_freezer, 0) >= (CURRENT_DATE - last_active - 1) THEN streak
                   ELSE 0
               END,
               streak_freezer = CASE
                   WHEN last_active IS NULL THEN streak_freezer
                   WHEN CURRENT_DATE - last_active <= 1 THEN streak_freezer
                   WHEN COALESCE(streak_freezer, 0) >= (CURRENT_DATE - last_active - 1)
                       THEN streak_freezer - (CURRENT_DATE - last_active - 1)
                   ELSE streak_freezer
               END,
               last_active = CASE
                   WHEN last_active IS NULL THEN last_active
                   WHEN CURRENT_DATE - last_active <= 1 THEN last_active
                   WHEN COALESCE(streak_freezer, 0) >= (CURRENT_DATE - last_active - 1)
                       THEN CURRENT_DATE - 1
                   ELSE last_active
               END
             WHERE id = $1 AND last_active IS NOT NULL AND CURRENT_DATE - last_active > 1`,
            [userId]
        );

        next(); // Move smoothly on to your endpoint route (like /api/user/profile)
    } catch (err) {
        console.error("Failed to process daily heart validation sync:", err);
        return res.status(500).json({ error: "Internal server error syncing health stats" });
    }
};





app.get('/api/user/profile', authenticateToken, verifyAndResetDailyHearts, async (req, res) => {
    try {
        // By the time this code runs, verifyAndResetDailyHearts has already updated their rows if it's a new day!
        const result = await db.query(
            `SELECT id, name, email, hearts, xp, lessons, coins, notes, streak, streak_freezer, premium
             FROM users WHERE id = $1`,
            [req.user.userId]
        );

        return res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching profile payload:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.post('/api/signin', async (req, res) => {
    try {
        // 1. Grab the keys sent exactly as written in your React Native fetch body
        const { name, pw, email } = req.body;

        // Validation safety check
        if (!name || !pw || !email)  {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // 2. Query your PostgreSQL pool to find the user
        // Adjust the column names (e.g., username vs name) if your DB schema is different!
        const result = await db.query(
            `SELECT * FROM users WHERE email = $1`, 
            [email]
        );
        const result1 = await db.query(
            `SELECT * FROM users WHERE name = $1`,
            [name]
        )

        // If user array comes back empty, stop right here
        if (result.rows.length === 0 && result1.rows.length === 0)  {
            const now = new Date();

// Create a new date stripped of the current time, set to midnight UTC
const midnightUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

const sqlFormat = midnightUTC.toISOString();

const hash = await bcrypt.hash(pw, 10);

        await db.query(
            `INSERT INTO users (name, pw, email, hearts, xp, lessons, coins, datehearts)
             VALUES ($1, $2, $3, 3, 0, 0, 0, $4);`,
            [name, hash, email, sqlFormat]
        )
         return res.status(200).json({ success: true });
        } else {
            return res.status(400).json({ error: "username or email already taken" });
        } 

    } catch (err) { //  This '}' now correctly closes the 'try' block up top
        console.error('Error during login execution:', err);
        return res.status(500).json({ error: 'An internal server error occurred' });
    }
});

app.post('/api/auth/google', async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) {
            return res.status(400).json({ error: "Missing idToken" });
        }
        if (!GOOGLE_WEB_CLIENT_ID) {
            console.error("GOOGLE_WEB_CLIENT_ID env var is not set");
            return res.status(500).json({ error: "Google login not configured on server" });
        }

        // 1. Verify the token actually came from Google and was issued for OUR app
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: GOOGLE_WEB_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const googleId = payload.sub;
        const email = payload.email;
        const displayName = payload.name || (email ? email.split('@')[0] : 'user');

        if (!email) {
            return res.status(400).json({ error: "Google account has no email" });
        }

        // 2. Already linked? (found by google_id)
        let result = await db.query(`SELECT * FROM users WHERE oauth = $1`, [googleId]);
        let user = result.rows[0];

        // 3. Not linked yet — try to LINK to an existing email account
        if (!user) {
            result = await db.query(`SELECT * FROM users WHERE email = $1`, [email]);
            user = result.rows[0];
            if (user) {
                await db.query(`UPDATE users SET oauth = $1 WHERE id = $2`, [googleId, user.id]);
            } else {
                // 4. Brand-new user — create one (no password)
                const now = new Date();
                const midnightUTC = new Date(Date.UTC(
                    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()
                )).toISOString();
                const name = await uniqueName(displayName);
                const insert = await db.query(
                    `INSERT INTO users (name, pw, email, oauth, hearts, xp, lessons, coins, datehearts)
                     VALUES ($1, NULL, $2, $3, 3, 0, 0, 0, $4)
                     RETURNING *`,
                    [name, email, googleId, midnightUTC]
                );
                user = insert.rows[0];
            }
        }

        // 5. Mint OUR jwt — identical to the email/password login path
        const token = jwt.sign(
            { userId: user.id, username: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(200).json({
            success: true,
            token,
            user: { id: user.id, username: user.email },
        });
    } catch (err) {
        console.error('Google auth error:', err);
        return res.status(401).json({ error: "Google authentication failed" });
    }
});


// Step 1 of password reset: user gives their email, we email a 6-digit code.
app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "Chybí e-mail" });
        }

        const result = await db.query(`SELECT id, pw FROM users WHERE email = $1`, [email.trim()]);
        const user = result.rows[0];

        // Generate + store a code only if the account exists AND has a password
        // (Google-only accounts have pw = NULL — they can't reset a password they don't have).
        if (user && user.pw) {
            const code = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
            const codeHash = await bcrypt.hash(code, 10);
            const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min

            await db.query(
                `UPDATE users SET reset_code = $1, reset_expires = $2 WHERE id = $3`,
                [codeHash, expires, user.id]
            );

            try {
                await sendResetEmail(email.trim(), code);
            } catch (mailErr) {
                console.error("Failed to send reset email:", mailErr);
                return res.status(500).json({ error: "Nepodařilo se odeslat e-mail" });
            }
        }

        // Always return success — never reveal whether an account exists.
        return res.json({ success: true });
    } catch (err) {
        console.error('forgot-password error:', err);
        return res.status(500).json({ error: 'An internal server error occurred' });
    }
});

// Step 2 of password reset: verify the code and set the new password.
app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;
        if (!email || !code || !newPassword) {
            return res.status(400).json({ error: "Chybí povinná pole" });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ error: "Heslo musí mít alespoň 6 znaků" });
        }

        const result = await db.query(
            `SELECT id, reset_code, reset_expires FROM users WHERE email = $1`,
            [email.trim()]
        );
        const user = result.rows[0];

        if (!user || !user.reset_code || !user.reset_expires) {
            return res.status(400).json({ error: "Neplatný nebo expirovaný kód" });
        }
        if (new Date(user.reset_expires) < new Date()) {
            return res.status(400).json({ error: "Kód vypršel, požádej o nový" });
        }

        const codeMatch = await bcrypt.compare(String(code), user.reset_code);
        if (!codeMatch) {
            return res.status(400).json({ error: "Neplatný kód" });
        }

        const hash = await bcrypt.hash(newPassword, 10);
        await db.query(
            `UPDATE users SET pw = $1, reset_code = NULL, reset_expires = NULL WHERE id = $2`,
            [hash, user.id]
        );

        return res.json({ success: true });
    } catch (err) {
        console.error('reset-password error:', err);
        return res.status(500).json({ error: 'An internal server error occurred' });
    }
});


// Save the user's personal note for ONE lesson. `notes` is a JSONB object on the
// users row, mapping lessonId -> note text. We upsert just the one key.
app.post('/api/user/notes', authenticateToken, async (req, res) => {
    try {
        const { lessonId, note } = req.body;
        if (lessonId === undefined || lessonId === null || typeof note !== 'string') {
            return res.status(400).json({ error: "Missing 'lessonId' or 'note' in body" });
        }
        const result = await db.query(
            `UPDATE users
             SET notes = jsonb_set(COALESCE(notes, '{}'::jsonb), ARRAY[$1], to_jsonb($2::text))
             WHERE id = $3
             RETURNING notes`,
            [String(lessonId), note, req.user.userId]
        );
        return res.json({ success: true, notes: result.rows[0]?.notes ?? {} });
    } catch (err) {
        console.error('save-notes error:', err);
        res.status(500).json({ error: "Failed to save notes" });
    }
});


// Shop: buy 1 heart for 50 coins. Capped at the normal daily max of 3 hearts.
const HEART_COST = 50;
const HEART_MAX = 3;
app.post('/api/shop/buy-heart', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(
            `UPDATE users
             SET hearts = hearts + 1, coins = coins - $2
             WHERE id = $1 AND coins >= $2 AND hearts < $3
             RETURNING hearts, coins`,
            [req.user.userId, HEART_COST, HEART_MAX]
        );

        if (result.rows.length === 0) {
            const u = await db.query(`SELECT hearts, coins FROM users WHERE id = $1`, [req.user.userId]);
            const row = u.rows[0];
            if (!row) return res.status(404).json({ error: "User not found" });
            if (row.hearts >= HEART_MAX) {
                return res.status(400).json({ error: "Máš plný počet životů" });
            }
            return res.status(400).json({ error: "Nemáš dost mincí" });
        }

        return res.json({ success: true, hearts: result.rows[0].hearts, coins: result.rows[0].coins });
    } catch (err) {
        console.error('buy-heart error:', err);
        res.status(500).json({ error: "Failed to buy heart" });
    }
});

// Shop: buy 1 streak freezer for 200 coins. Capped at 2 owned.
const FREEZER_COST = 200;
const FREEZER_MAX = 2;
app.post('/api/shop/buy-freezer', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(
            `UPDATE users
             SET streak_freezer = COALESCE(streak_freezer, 0) + 1, coins = coins - $2
             WHERE id = $1 AND coins >= $2 AND COALESCE(streak_freezer, 0) < $3
             RETURNING streak_freezer, coins`,
            [req.user.userId, FREEZER_COST, FREEZER_MAX]
        );

        if (result.rows.length === 0) {
            const u = await db.query(`SELECT streak_freezer, coins FROM users WHERE id = $1`, [req.user.userId]);
            const row = u.rows[0];
            if (!row) return res.status(404).json({ error: "User not found" });
            if ((row.streak_freezer || 0) >= FREEZER_MAX) {
                return res.status(400).json({ error: "Máš maximální počet mrazáků (2)" });
            }
            return res.status(400).json({ error: "Nemáš dost mincí" });
        }

        return res.json({ success: true, streak_freezer: result.rows[0].streak_freezer, coins: result.rows[0].coins });
    } catch (err) {
        console.error('buy-freezer error:', err);
        res.status(500).json({ error: "Failed to buy freezer" });
    }
});


// RevenueCat webhook — the source of truth for the `premium` expiry date. RevenueCat
// POSTs subscription events here; configure a shared secret as the Authorization header
// value in the RevenueCat dashboard and store the same value in REVENUECAT_WEBHOOK_AUTH.
// The app identifies each RevenueCat user with our DB user id (Purchases.logIn(id)), so
// event.app_user_id maps straight to users.id.
app.post('/api/revenuecat/webhook', async (req, res) => {
    try {
        const expected = process.env.REVENUECAT_WEBHOOK_AUTH;
        if (!expected || req.headers['authorization'] !== expected) {
            return res.status(401).json({ error: 'unauthorized' });
        }

        const event = req.body && req.body.event;
        if (!event) return res.status(400).json({ error: 'missing event' });

        const userId = parseInt(event.app_user_id, 10);
        if (!Number.isFinite(userId)) {
            // Anonymous / not one of our users — ack so RevenueCat stops retrying.
            return res.json({ ok: true });
        }

        const type = event.type;
        const expMs = event.expiration_at_ms;

        // Events that grant/extend access → set premium to the entitlement's expiry.
        const GRANTS = [
            'INITIAL_PURCHASE', 'RENEWAL', 'PRODUCT_CHANGE',
            'UNCANCELLATION', 'NON_RENEWING_PURCHASE',
        ];

        if (GRANTS.includes(type) && expMs) {
            await db.query(
                `UPDATE users SET premium = to_timestamp($1::bigint / 1000.0) WHERE id = $2`,
                [expMs, userId]
            );
        } else if (type === 'EXPIRATION') {
            await db.query(`UPDATE users SET premium = NULL WHERE id = $1`, [userId]);
        }
        // CANCELLATION = auto-renew off but still active until expiry → leave premium as-is.

        return res.json({ ok: true });
    } catch (err) {
        console.error('revenuecat webhook error:', err);
        return res.status(500).json({ error: 'webhook failed' });
    }
});


app.post('/api/user/lose-heart', authenticateToken, async (req, res) => {
    try {
        // Decrement hearts by 1 (never below 0) — but premium users (active subscription)
        // have infinite hearts, so their count is left untouched.
        const result = await db.query(
            `UPDATE users
             SET hearts = CASE
                 WHEN premium IS NOT NULL AND premium > NOW() THEN hearts
                 ELSE GREATEST(0, hearts - 1)
             END
             WHERE id = $1
             RETURNING hearts, coins, xp`,
            [req.user.userId]
        );

        return res.json({
            success: true,
            updatedHearts: result.rows[0].hearts
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update stats" });
    }
});


app.post('/api/user/lesson-finish', authenticateToken, async (req, res) => {
    try {
        const { position } = req.body;
        if (typeof position !== 'number' || position < 1) {
            return res.status(400).json({ error: "Missing or invalid 'position' in body" });
        }

        // Finishing any lesson counts as activity today — update the daily streak.
        //  - already active today  → unchanged
        //  - last active yesterday → +1 (streak continues)
        //  - otherwise (gap/null)  → reset to 1 (fresh streak starting today)
        const streakResult = await db.query(
            `UPDATE users
             SET streak = CASE
                     WHEN last_active = CURRENT_DATE THEN streak
                     WHEN last_active = CURRENT_DATE - 1 THEN COALESCE(streak, 0) + 1
                     ELSE 1
                 END,
                 last_active = CURRENT_DATE
             WHERE id = $1
             RETURNING streak`,
            [req.user.userId]
        );
        const updatedStreak = streakResult.rows[0]?.streak;

        // Coin reward: a flat 20 plus the current streak (the streak bonus caps at 20).
        const reward = 20 + Math.min(updatedStreak || 0, 20);

        // Only increment (and pay out coins) if this is the user's next-up lesson (lessons + 1).
        // Coins are awarded on first completion only — replays don't pay, to avoid farming.
        const result = await db.query(
            `UPDATE users
             SET lessons = COALESCE(lessons, 0) + 1,
                 coins = COALESCE(coins, 0) + $3
             WHERE id = $1 AND COALESCE(lessons, 0) + 1 = $2
             RETURNING lessons, coins, xp`,
            [req.user.userId, position, reward]
        );

        if (result.rows.length === 0) {
            // No row updated — either user not found OR this was a replay of a finished lesson.
            const userRow = await db.query(
                `SELECT lessons, coins, xp FROM users WHERE id = $1`,
                [req.user.userId]
            );
            if (userRow.rows.length === 0) {
                return res.status(404).json({ error: "User not found" });
            }
            return res.json({
                success: true,
                updatedLessons: userRow.rows[0].lessons,
                updatedCoins: userRow.rows[0].coins,
                coinsAwarded: 0,
                updatedStreak,
                wasReplay: true,
            });
        }

        return res.json({
            success: true,
            updatedLessons: result.rows[0].lessons,
            updatedCoins: result.rows[0].coins,
            coinsAwarded: reward,
            updatedStreak,
            wasReplay: false,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update stats" });
    }
});


    // Middleware helper to reset hearts daily on user interaction



// Chains both validation layers together back-to-back
app.post('/api/login', async (req, res) => {
    try {
        // 1. Grab the keys sent exactly as written in your React Native fetch body
        const { name, pw } = req.body;

        // Validation safety check
        if (!name || !pw) {
            return res.status(400).json({ error: "Missing username or password" });
        }

        // 2. Query your PostgreSQL pool to find the user
        // Adjust the column names (e.g., username vs name) if your DB schema is different!
        const result = await db.query(
            `SELECT * FROM users WHERE email = $1`, 
            [name]
        );

        // If user array comes back empty, stop right here
        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const user = result.rows[0];

        // 3. Compare the plaintext 'pw' with the hashed password column from your DB row
        // Note: Replace 'password_hash' with the exact name of your database column!
        const isMatch = await bcrypt.compare(pw, user.pw);

        if (!isMatch) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // 4. Everything matches! Generate a signed JSON Web Token (JWT)
        const token = jwt.sign(
            { userId: user.id, username: user.email },
            JWT_SECRET,
            { expiresIn: '7d' } // Token auto-expires in 7 days
        );

        // 5. Send it back to React Native. This resolves as 'data.token' in your app
        return res.status(200).json({
            success: true,
            token: token,
            user: { id: user.id, username: user.email }
        });

    } catch (err) {
        console.error('Error during login execution:', err);
        return res.status(500).json({ error: 'An internal server error occurred' });
    }
});


//API endpoint  to get the user data
app.get('/api/users', async (req, res) => {
        try {
            const result = await db.query(
                `SELECT * FROM users;`
            )
            res.json(result.rows);

        } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Error fetching users' });
    } 




});


app.get('/api/users/:id', async (req, res) => {
        try {
            const userId = parseInt(req.params.id);
            const result = await db.query(
                `SELECT * FROM users WHERE id = $1`,
                [userId]);

             if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
                    res.json(result.rows[0]);


        } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Error fetching users' });
    } 




});


// API endpoint to get all lessons
app.get('/api/lessons', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT id, title, intro, summary, before_exercise, outro, created_at
             FROM lessons
             ORDER BY created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching lessons:', err);
        res.status(500).json({ error: 'Error fetching lessons' });
    }
});

// API endpoint to get a specific lesson with all exercises
app.get('/api/lessons/:id', async (req, res) => {
    console.log('GET /api/lessons/:id - Request received, lessonId:', req.params.id);
    const lessonId = parseInt(req.params.id);
    
    try {
        // Get lesson data
        const lessonResult = await db.query(
            `SELECT id, title, intro, summary, before_exercise, outro
             FROM lessons
             WHERE id = $1`,
            [lessonId]
        );
        
        if (lessonResult.rows.length === 0) {
            return res.status(404).json({ error: 'Lesson not found' });
        }
        
        const lesson = lessonResult.rows[0];
        
        // Get all exercises for this lesson
        const exercisesResult = await db.query(
            `SELECT e.id, e.type, e.question, ed.data 
             FROM exercises e
             LEFT JOIN exercise_data ed ON e.id = ed.exercise_id
             WHERE e.lesson_id = $1
             ORDER BY e.id`,
            [lessonId]
        );
        
        // Transform exercises to match React component expectations
        const exercises = exercisesResult.rows.map(exercise => {
            const exerciseData = exercise.data || {};
            const transformed = {
                type: exercise.type
            };
            
            switch(exercise.type) {
                case 'Question':
                    // Transform options array to a1, a2, a3, a4 and get correct answer
                    const options = exerciseData.options || [];
                    transformed.question = exercise.question;
                    transformed.a1 = options[0] || '';
                    transformed.a2 = options[1] || '';
                    transformed.a3 = options[2] || '';
                    transformed.a4 = options[3] || '';
                    transformed.correct = options[exerciseData.correct_index] || '';
                    break;
                    
                case 'MatchExcercise':
                    transformed.options = exerciseData.options || [];
                    transformed.labels = exerciseData.labels || [];
                    break;
                    
                case 'Game':
                    transformed.question = exercise.question;
                    transformed.optionOneName = exerciseData.optionOneName || '';
                    transformed.optionTwoName = exerciseData.optionTwoName || '';
                    transformed.optionOneItems = exerciseData.optionOneItems || [];
                    transformed.optionTwoItems = exerciseData.optionTwoItems || [];
                    break;
                    
                case 'Calc':
                    transformed.question = exercise.question;
                    transformed.correct = exerciseData.correct;
                    transformed.typeResult = exerciseData.typeResult || 'text';
                    break;
                    
                case 'Info':
                    transformed.title = exerciseData.title || '';
                    transformed.icon = exerciseData.icon || '';
                    transformed.content = exerciseData.content || '';
                    break;
                case 'MultiChoice':
                    transformed.question = exercise.question;
                    transformed.options = exerciseData.options || [];
                    transformed.correct = exerciseData.correct || [];
                    break;

                case 'Conversation':
                    transformed.question = exercise.question
                    transformed.people = exerciseData.people || '';
                    transformed.messages = exerciseData.messages || "";
                    break;

                case 'VIP':
                    // Return the full APP_DATA payload as-is
                    transformed.appData = exerciseData;
                    break;
            }

            // Post-answer explanation, present on most gradable exercises.
            transformed.feedback = exerciseData.feedback || null;

            return transformed;
        });
        
        res.json({
            id: lesson.id,
            title: lesson.title,
            intro: lesson.intro,
            summary: lesson.summary,
            before_exercise: lesson.before_exercise,
            outro: lesson.outro,
            exercises: exercises
        });
        
    } catch (err) {
        console.error('Error fetching lesson:', err);
        res.status(500).json({ error: 'Error fetching lesson' });
    }
});

app.post('/api/submit', async (req, res) => {
    const jsonString = req.body.json;
    const client = await db.connect();
    
    try {
        await client.query('BEGIN');
        
        const data = JSON.parse(jsonString);
        console.log('Přijatá data z formuláře:');
        console.log(JSON.stringify(data, null, 2));
        
        // Insert lesson
        const lessonResult = await client.query(
            `INSERT INTO lessons (title, intro, before_exercise, outro) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id`,
            [data.title, data.intro, data.beforeExercise, data.outro]
        );
        
        const lessonId = lessonResult.rows[0].id;
        console.log(`Lesson inserted with ID: ${lessonId}`);
        
        // Insert exercises
        for (const exercise of data.exercises) {
            // Insert exercise
            const exerciseResult = await client.query(
                `INSERT INTO exercises (lesson_id, type, question) 
                 VALUES ($1, $2, $3) 
                 RETURNING id`,
                [lessonId, exercise.type, exercise.question || null]
            );
            
            const exerciseId = exerciseResult.rows[0].id;
            console.log(`Exercise inserted with ID: ${exerciseId}`);
            
            // Prepare exercise data based on type
            let exerciseData = {};
            
            switch(exercise.type) {
                case 'Question':
                    exerciseData = {
                        options: exercise.options || [],
                        correct_index: exercise.correct_index
                    };
                    break;

                case 'MultiChoice':
                    exerciseData = {
                        options: exercise.options || [],
                        correct: exercise.correct || []
                    };
                    break;

                case 'MatchExcercise':
                    exerciseData = {
                        options: exercise.options || [],
                        labels: exercise.labels || []
                    };
                    break;
                    
                case 'Game':
                    exerciseData = {
                        optionOneName: exercise.optionOneName,
                        optionTwoName: exercise.optionTwoName,
                        optionOneItems: exercise.optionOneItems || [],
                        optionTwoItems: exercise.optionTwoItems || []
                    };
                    break;
                    
                case 'Calc':
                    exerciseData = {
                        correct: exercise.correct,
                        typeResult: exercise.typeResult
                    };
                    break;
                    
                case 'Info':
                    exerciseData = {
                        title: exercise.title,
                        content: exercise.content,
                        icon: exercise.icon
                    };
                    break;
                case 'Conversation':
                    exerciseData = {
                        people: exercise.people,
                        messages: exercise.messages
                    };
                    break;

                case 'VIP':
                    // Store the full APP_DATA payload as-is
                    exerciseData = exercise.appData || {};
                    break;
            }

            // Preserve the post-answer explanation if the form provided one.
            if (exercise.feedback != null && exercise.type !== 'VIP') {
                exerciseData.feedback = exercise.feedback;
            }

            // Insert exercise_data
            await client.query(
                `INSERT INTO exercise_data (exercise_id, data) 
                 VALUES ($1, $2::jsonb)`,
                [exerciseId, JSON.stringify(exerciseData)]
            );
            
            console.log(`Exercise data inserted for exercise ID: ${exerciseId}`);
        }
        
        await client.query('COMMIT');
        console.log('All data successfully inserted into database');
        res.json({ success: true, lessonId: lessonId });
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Chyba při ukládání do databáze:', err);
        res.status(500).json({ error: 'Chyba při ukládání dat do databáze' });
    } finally {
        client.release();
    }
});

// Serve static files from the React app build directory (only if dist folder exists)










const distPath = path.join(__dirname, '..', 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  
  // Handle React routing - return all requests to React app (SPA)
  // Must be last, after all API routes
  app.use((req, res) => {
    // Don't serve index.html for API routes (shouldn't reach here, but safety check)
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  console.warn('WARNING: dist folder not found. Static files will not be served.');
  // If dist doesn't exist, just return 404 for non-API routes
  app.use((req, res) => {
    if (!req.path.startsWith('/api')) {
      return res.status(404).send('Frontend not built. Run "npm run build" first.');
    }
    res.status(404).json({ error: 'API endpoint not found' });
  });
}


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

