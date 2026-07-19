const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Country = require('./models/countryModel');

// Load env variables
dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB!");

    // 1. Fetch data from the free countries.dev API
    console.log("Fetching data from countries.dev...");
    const response = await fetch('https://countries.dev/countries');
    const apiData = await response.json();
    
    // Safely extract the array whether it's wrapped in a 'data' object or not
    const countriesList = Array.isArray(apiData) ? apiData : (apiData.data || []);

    // 2. Filter for independent countries and map the exact fields we need
    const countriesData = countriesList
      .filter(country => country.independent === true && country.flags)
      .map(country => ({
        name: country.name,
        flagUrl: country.flags.png || country.flags.svg,
        capital: country.capital || "Unknown",
        region: country.region || "Unknown",
        subregion: country.subregion || "Unknown",
        population: country.population || 0,
        borders: country.borders || [], // Arrays default to empty if island
        cioc: country.cioc || "",
        alpha3Code: country.alpha3Code || "",
        // Safely dig into the currencies array to get the name
        currencyName: country.currencies && country.currencies.length > 0 
            ? country.currencies[0].name 
            : "Unknown"
      }));

    console.log(`Found ${countriesData.length} independent countries! Preparing database...`);

    // 3. Clear old data and insert new
    await Country.deleteMany();
    console.log("Cleared old database records...");

    await Country.insertMany(countriesData);
    console.log("Successfully added all countries from countries.dev!");

    // Exit the script
    process.exit();
  } catch (error) {
    console.error("Error with database seeding:", error);
    process.exit(1);
  }
};

seedDatabase();