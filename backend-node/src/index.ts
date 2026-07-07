import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './database';

import authRouter from './routers/auth';
import agendasRouter from './routers/agendas';
import articlesRouter from './routers/articles';
import metadataRouter from './routers/metadata';

dotenv.config();

const app = express();

console.log("Loading Agenda Node API...");

app.use(express.json());

// Configure CORS
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://agenda-pied-eta.vercel.app",
    "https://agenda-kngy515d1-rans-projects-66467de7.vercel.app",
];

app.use(cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1 || origin.match(/https:\/\/.*\.vercel\.app/)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

console.log("Importing routers...");

// Include routers
app.use('/auth', authRouter);
app.use('/agendas', agendasRouter);
app.use('/', articlesRouter); // Articles router has paths like /agendas/:id/articles
app.use('/api', metadataRouter); // Metadata router has /extract

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: "Agenda Node API",
        version: "1.0.0",
        docs: "Not implemented in Node version yet"
    });
});

const PORT = process.env.API_PORT || 8000;

// Initialize database on startup and start server
async function startup() {
    console.log("Starting up...");
    try {
        await initDb();
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (e) {
        console.error(`❌ Failed to start application: ${e}`);
        process.exit(1);
    }
}

startup();
