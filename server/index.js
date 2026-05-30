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


app.post('/api/singin', async (req, res) => {
    try {
        // 1. Grab the keys sent exactly as written in your React Native fetch body
        const { name, pw, email } = req.body;

        // Validation safety check
        if (!name || !pw || !email)  {
            return res.status(400).json({ error: "Missing username or password" });
        }

        // 2. Query your PostgreSQL pool to find the user
        // Adjust the column names (e.g., username vs name) if your DB schema is different!
        const result = await db.query(
            `SELECT * FROM users WHERE email = $1`, 
            [name]
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
            `INSERT INTO users (name, pw, email, hearts, xp, coins, datehearts)
             VALUES ($1, $2, $3, 3, 0, 0, $4);`,
            [name, hash, email, sqlFormat]
        )
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
            { expiresIn: '15m' } // Token auto-expires in 7 days
        );

        // 5. Send it back to React Native. This resolves as 'data.token' in your app
        return res.status(200).json({
            success: true,
        });

    } catch (err) {
        console.error('Error during login execution:', err);
        return res.status(500).json({ error: 'An internal server error occurred' });
    }
});


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
            { expiresIn: '15m' } // Token auto-expires in 7 days
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

