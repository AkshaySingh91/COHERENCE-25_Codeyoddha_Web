import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AirQualityMap from '../Components/MapView';

const HomePage = () => {
  const [countriesData, setCountriesData] = useState([]);

  useEffect(() => {
    // Fetch global air quality data from our backend
    const fetchData = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/air-quality/global');
        // Assume each item in res.data has country name and, if available, approximate lat/lon.
        // For demonstration, we add sample lat/lon coordinates.
        const data = res.data.map((item, index) => ({
          country: item.country,
          aqi: Math.floor(Math.random() * 200), // random AQI for demonstration
          location: {
            lat: 20 + index, // sample lat; in real usage, use real coordinates (via geocoding if necessary)
            lng: 0 + index,
          },
        }));
        console.log(data)
        setCountriesData(data);
      } catch (error) {
        console.error('Error fetching global data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h1>Smart City Air Quality Dashboard</h1>
      <AirQualityMap />
      {/* Live Data Section at Bottom */}
      <div style={{ margin: '20px' }}>
        <h2>Live Data: Top Regions by Air IQ</h2>
        <div style={{ display: 'flex', overflowX: 'scroll' }}>
          {countriesData.slice(0, 5).map((country) => (
            <div key={country.country} style={{
              padding: '10px', margin: '5px', border: '1px solid #ccc', borderRadius: '5px'
            }}>
              <h3>{country.country}</h3>
              <p>AQI: {country.aqi}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
