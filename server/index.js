import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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
            `SELECT id, name, email, hearts, xp, lessons, coins FROM users WHERE id = $1`,
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

app.post('/api/user/lose-heart', authenticateToken, async (req, res) => {
    try {
        // Safely decrement hearts by 1, but make sure it never goes below 0
        const result = await db.query(
            `UPDATE users 
             SET hearts = GREATEST(0, hearts - 1) 
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
        // Safely decrement hearts by 1, but make sure it never goes below 0
        const result = await db.query(
            `UPDATE users 
             SET lessons =  lessons + 1 
             WHERE id = $1 
             RETURNING lessons, coins, xp`,
            [req.user.userId]
        );

        return res.json({
            success: true,
            updatedLessons: result.rows[0].lessons
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
            `SELECT id, title, intro, before_exercise, outro, created_at 
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
            `SELECT id, title, intro, before_exercise, outro 
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
            
            return transformed;
        });
        
        res.json({
            id: lesson.id,
            title: lesson.title,
            intro: lesson.intro,
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

