const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dbConfig = require('./config/dbConfig');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/services', require('./routes/servicesRoutes'));
app.use('/api/contacts', require('./routes/contactsRoutes'));

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});