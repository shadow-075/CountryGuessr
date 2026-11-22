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
// Flags never change, so keep them in memory and let browsers/CDN cache them for a year.
const flagCache = new Map(); // id -> { buffer, type }

app.get('/api/countries/flag/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let cached = flagCache.get(id);

        if (!cached) {
            // 1. Find the country by its database ID
            const country = await Country.findById(id);
            if (!country) return res.status(404).send("Country not found");

            // 2. Fetch the image secretly on the backend (one retry), and make sure it really worked
            let response;
            for (let attempt = 0; attempt < 2; attempt++) {
                try {
                    response = await fetch(country.flagUrl);
                    if (response.ok) break;
                } catch (e) { /* try again */ }
            }
            if (!response || !response.ok) return res.status(502).send("Flag source unavailable");

            cached = {
                buffer: Buffer.from(await response.arrayBuffer()),
                type: response.headers.get('content-type') || 'image/png',
            };
            flagCache.set(id, cached);
        }

        res.set('Content-Type', cached.type);
        res.set('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
        res.send(cached.buffer);
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
