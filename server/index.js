import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3001; // Different port from Vite dev server

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

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});

