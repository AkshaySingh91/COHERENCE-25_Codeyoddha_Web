import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint to fetch global air quality data (list of countries)
app.get("/api/air-quality/global", async (req, res) => {
    try {
        const url = `http://api.airvisual.com/v2/countries?key=${process.env.IQAIR_API_KEY}`;
        const response = await axios.get(url);
        res.json(response.data.data);
    } catch (error) {
        console.error("Error fetching global data:", error.message);
        res.status(500).json({ error: "Failed to fetch global air quality data" });
    }
});

// Endpoint to fetch region/state data for a given country
app.get("/api/air-quality/region", async (req, res) => {
    try {
        const { country } = req.query;
        const url = `http://api.airvisual.com/v2/states?country=${country}&key=${process.env.IQAIR_API_KEY}`;

        const response = await axios.get(url);
        res.json(response.data.data);
    } catch (error) {
        console.error("Error fetching region data:", error.message);
        res.status(500).json({ error: "Failed to fetch region data" });
    }
});

// Endpoint to fetch detailed data for a specific city
app.get("/api/air-quality/details", async (req, res) => {
    try {
        const { city, state, country } = req.query;
        const url = `http://api.airvisual.com/v2/city?city=${city}&state=${state}&country=${country}&key=${process.env.IQAIR_API_KEY}`;
        const response = await axios.get(url);
        res.json(response.data.data);
    } catch (error) {
        console.error("Error fetching detail data:", error.message);
        res.status(500).json({ error: "Failed to fetch detailed air quality data" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
