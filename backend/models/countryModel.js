const mongoose = require('mongoose');

const countrySchema = new mongoose.Schema({
    name: { type: String, required: true },
    flagUrl: { type: String, required: true },
    capital: { type: String },
    region: { type: String },
    subregion: { type: String },
    population: { type: Number },
    borders: [{ type: String }], // Array of strings for the border codes
    cioc: { type: String },
    alpha3Code: { type: String }, // This is the one used in the borders array!
    currencyName: { type: String }
});

module.exports = mongoose.model('Country', countrySchema);