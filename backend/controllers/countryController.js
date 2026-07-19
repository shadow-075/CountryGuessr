const Country = require('../models/countryModel');

// 1. Get a random country for the user to guess
const getRandomCountry = async (req, res) => {
    try {
        const count = await Country.countDocuments();
        if (count === 0) {
            return res.status(404).json({ message: "No countries found in database" });
        }

        const random = Math.floor(Math.random() * count);
        const country = await Country.findOne().skip(random);

        res.json(country);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. Add a new country (we will use this to fill our database later)
const addCountry = async (req, res) => {
    const { name, flagUrl } = req.body;
    try {
        const newCountry = await Country.create({ name, flagUrl });
        res.status(201).json(newCountry);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { getRandomCountry, addCountry };