import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

const DetailsPage = () => {
  const [searchParams] = useSearchParams();
  const country = searchParams.get('country');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  // For demo, we use static values. In a real app, you would fetch details based on city/state/country.
  const [details, setDetails] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        // Replace with real query parameters (city, state, country) as per IQAir API.
        const res = await axios.get('http://localhost:5000/api/air-quality/details', {
          params: {
            city: 'Mogogosiek Tea Factory', // sample placeholder
            state: 'Kisumu',
            country: country
          }
        });
        setDetails(res.data);
      } catch (error) {
        console.error('Error fetching details:', error);
        // For demo, we set sample data
        setDetails({
          location: 'Near Mogogosiek Tea Factory, Kisumu',
          aqi: 57,
          description: 'Moderate',
          temperature: 15,
          wind: {
            degree: 54,
            speed: 2.8,
            unit: 'km/h'
          },
          humidity: 94,
          pollutants: {
            pm25: '12.4 µg/m³',
            pm10: '20 µg/m³',
            o3: '30 ppb'
          },
          forecast: {
            previous7Days: [], // you could fill with an array of forecast objects
            next3Days: [] 
          },
          recommendations: [
            { icon: '🚴‍♂️', text: 'Sensitive groups should reduce outdoor exercise' },
            { icon: '🪟', text: 'Close your windows to avoid dirty outdoor air' },
            { icon: '😷', text: 'Sensitive groups should wear a mask outdoors' },
          ]
        });
      }
    };

    fetchDetails();
  }, [country]);

  if (!details) return <p>Loading details...</p>;

  return (
    <div style={{ display: 'flex', padding: '20px', flexWrap: 'wrap' }}>
      {/* Left side: Detailed Info */}
      <div style={{ flex: '1 1 400px', marginRight: '20px' }}>
        <h2>Air quality near {details.location}</h2>
        <div style={{
          border: '1px solid #ccc', padding: '10px', borderRadius: '8px', marginBottom: '20px'
        }}>
          <h3>{details.aqi} Air IQ – {details.description} – {details.temperature}°</h3>
          <p>Wind: {details.wind.degree}° at {details.wind.speed} {details.wind.unit}</p>
          <p>Humidity: {details.humidity}%</p>
        </div>
        <div style={{ marginBottom: '20px' }}>
          <h3>7-Day & Next 3-Day Forecast</h3>
          {/* Render forecast charts or data here (could use a chart library) */}
          <p>[Forecast details go here]</p>
        </div>
        <div>
          <h3>Air Pollutants</h3>
          <p>PM2.5: {details.pollutants.pm25}</p>
          <p>PM10: {details.pollutants.pm10}</p>
          <p>O₃: {details.pollutants.o3}</p>
        </div>
      </div>

      {/* Right side: Health Recommendations */}
      <div style={{ flex: '0 1 300px', border: '1px solid #eee', padding: '10px', borderRadius: '8px' }}>
        <h3>Health Recommendations</h3>
        {details.recommendations.map((rec, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '24px', marginRight: '10px' }}>{rec.icon}</span>
            <p>{rec.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DetailsPage;
