const express = require('express');
const cors = require('cors');
const Country = require('./models/countryModel');
require('dotenv').config();

const connectDB = require('./config/db');

// Connect to the database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Allows to parse JSON data

// A simple test route
app.get('/', (req, res) => {
    res.send('CountryGuessr API is running!');
});

// Get a random country for the game
app.get('/api/countries/random', async (req, res) => {
    try {
        // $sample randomly picks a specified number of documents
        const randomCountryArray = await Country.aggregate([{ $sample: { size: 1 } }]);

        // aggregate returns an array, so we send the first item
        if (randomCountryArray.length > 0) {
            res.json(randomCountryArray[0]);
        } else {
            res.status(404).json({ message: "No countries found in database" });
        }
    } catch (error) {
        console.error("Error fetching random country:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Image Proxy Route to hide the real URL
app.get('/api/countries/flag/:id', async (req, res) => {
    try {
        // 1. Find the country by its database ID
        const country = await Country.findById(req.params.id);
        if (!country) return res.status(404).send("Country not found");

        // 2. Fetch the image secretly on the backend
        const response = await fetch(country.flagUrl);
        const arrayBuffer = await response.arrayBuffer();
        
        // 3. Convert it to a buffer so Express can send it as a real image
        const buffer = Buffer.from(arrayBuffer);
        
        res.set('Content-Type', 'image/png');
        res.send(buffer);
    } catch (error) {
        console.error("Error fetching image:", error);
        res.status(500).send("Error loading image");
    }
});

// Import Routes
const countryRoutes = require('./routes/countryRoutes');

// Use Routes
app.use('/api/countries', countryRoutes);
app.use('/api/users', require('./routes/userRoutes'));

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
