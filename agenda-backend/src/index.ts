import express = require('express');
import cors = require('cors');
import dotenv = require('dotenv');
import agendasRouter from './routes/agendas';
import articlesRouter from './routes/articles';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/agendas', agendasRouter);
app.use('/', articlesRouter);

app.get('/', (req, res) => {
  res.send('Agenda Backend is running');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
