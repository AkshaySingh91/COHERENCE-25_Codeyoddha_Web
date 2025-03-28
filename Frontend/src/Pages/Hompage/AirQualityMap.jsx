import React, { useEffect, useState } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import axios from "axios";

const containerStyle = {
    width: "100vw",
    height: "100vh"
};

const center = { lat: 20, lng: 0 };

const GOOGLE_MAPS_API_KEY = "AIzaSyAyP4jeW4zDC2iTGvMvA3XVdwCZeJC0WkI"; // Replace with your key
const IQAIR_BASE_URL = "http://localhost:5000/api/air-quality"; // Our proxy endpoints

// Zoom thresholds for different data levels
const ZOOM_COUNTRY = 4; // Zoom <=4: display countries
const ZOOM_STATE = 6;   // Zoom >4 and <=6: display states
// Zoom >6: display cities

// Helper: Return marker color based on AQI value
const getAQIColor = (aqi) => {
    if (aqi <= 50) return "#009966";
    if (aqi <= 100) return "#ffde33";
    if (aqi <= 150) return "#ff9933";
    if (aqi <= 200) return "#cc0033";
    if (aqi <= 300) return "#660099";
    return "#7e0023";
};

function AirQualityMap() {
    const [markers, setMarkers] = useState([]);
    const [mapRef, setMapRef] = useState(null);
    const geocoderRef = React.useRef(null);
    const zoomDebounceRef = React.useRef(null);

    // Use Google Maps Geocoder API (built-in) to get coordinates
    const geocodeLocation = (locationName) => {
        return new Promise((resolve) => {
            if (!geocoderRef.current) {
                geocoderRef.current = new window.google.maps.Geocoder();
            }
            geocoderRef.current.geocode({ address: locationName }, (results, status) => {
                if (status === "OK" && results && results.length > 0) {
                    const { lat, lng } = results[0].geometry.location;
                    resolve({ lat: lat(), lng: lng() });
                } else {
                    console.error("Geocoding error for", locationName, status);
                    resolve(null);
                }
            });
        });
    };

    // For demonstration, we use mock functions to generate AQI values.
    // In production, you would call your backend /details endpoint for city-level data.
    const getMockAQI = () => Math.floor(Math.random() * 300) + 1;

    // Clear existing markers
    const clearMarkers = () => {
        setMarkers([]);
    };

    // Load country-level data from our backend
    const loadCountries = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/air-quality/global");
            const countries = res.data; // Assuming your proxy returns an array of country objects with a 'country' field
            const markersData = await Promise.all(
                countries.map(async (item) => {
                    const countryName = item.country;
                    const aqiValue = getMockAQI(); // Replace with real value if available
                    const coords = await geocodeLocation(countryName);
                    if (coords) {
                        return {
                            position: coords,
                            label: {
                                text: String(aqiValue),
                                color: "#fff",
                                fontSize: "12px",
                                fontWeight: "bold",
                            },
                            icon: {
                                path: window.google.maps.SymbolPath.CIRCLE,
                                fillColor: getAQIColor(aqiValue),
                                fillOpacity: 1,
                                strokeColor: "#000",
                                strokeWeight: 1,
                                scale: 10,
                            },
                            title: `${countryName}\nAQI: ${aqiValue}`,
                        };
                    }
                    return null;
                })
            );
            setMarkers(markersData.filter((m) => m !== null));
        } catch (error) {
            console.error("Error loading countries:", error.message);
        }
    };


    // Load state-level data for the visible area
    const loadStatesForView = async (bounds) => {
        if (!bounds) {
            console.error("Bounds not available");
            return;
        }
        try {
            // Reverse geocode the center of the map to determine the current country
            const centerLatLng = bounds.getCenter();
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: centerLatLng }, async (results, status) => {
                if (status === "OK" && results && results.length > 0) {
                    let countryName = null;
                    // Loop through address components to extract the country
                    results[0].address_components.forEach((comp) => {
                        if (comp.types.includes("country")) {
                            countryName = comp.long_name;
                        }
                    });
                    if (!countryName) {
                        console.error("Could not determine country from reverse geocode.");
                        return;
                    }
                    console.log("Current country:", countryName);

                    // Fetch states for the determined country using your backend proxy
                    const statesRes = await axios.get(
                        `http://localhost:5000/api/air-quality/region?country=${encodeURIComponent(countryName)}`
                    );
                    const states = statesRes.data;
                    let newMarkers = [];
                    for (let st of states) {
                        const stateName = st.state;
                        // Use Google Geocoder to get the coordinates of the state
                        const stateCoords = await geocodeLocation(`${stateName}, ${countryName}`);
                        if (!stateCoords) continue;
                        // Only add marker if state center lies within the current map bounds
                        if (!bounds.contains(new window.google.maps.LatLng(stateCoords.lat, stateCoords.lng))) {
                            continue;
                        }
                        const aqiValue = getMockAQI(); // Replace with real data if available
                        newMarkers.push({
                            position: stateCoords,
                            label: {
                                text: String(aqiValue),
                                color: "#fff",
                                fontSize: "12px",
                                fontWeight: "bold",
                            },
                            icon: {
                                path: window.google.maps.SymbolPath.CIRCLE,
                                fillColor: getAQIColor(aqiValue),
                                fillOpacity: 1,
                                strokeColor: "#000",
                                strokeWeight: 1,
                                scale: 10,
                            },
                            title: `${stateName}, ${countryName}\nAQI: ${aqiValue}`,
                        });
                    }
                    setMarkers(newMarkers);
                } else {
                    console.error("Reverse geocoding failed:", status);
                }
            });
        } catch (error) {
            console.error("Error loading states:", error.message);
        }
    };



    // Load city-level data for the visible area
    const loadCitiesForView = async (bounds) => {
        try {
            const countryRes = await axios.get(`${IQAIR_BASE_URL}/global`);
            const countries = countryRes.data;
            let newMarkers = [];
            for (let item of countries) {
                const countryName = item.country;
                const countryCoords = await geocodeLocation(countryName);
                if (!countryCoords || !bounds.contains(new window.google.maps.LatLng(countryCoords.lat, countryCoords.lng))) {
                    continue;
                }
                // Get states for the country
                const statesRes = await axios.get(
                    `${IQAIR_BASE_URL}/region?country=${encodeURIComponent(countryName)}`
                );
                const states = statesRes.data;
                for (let st of states) {
                    const stateName = st.state;
                    const stateCoords = await geocodeLocation(`${stateName}, ${countryName}`);
                    if (!stateCoords || !bounds.contains(new window.google.maps.LatLng(stateCoords.lat, stateCoords.lng))) {
                        continue;
                    }
                    // Get cities for the state
                    const citiesRes = await axios.get(
                        `${IQAIR_BASE_URL}/cities?state=${encodeURIComponent(stateName)}&country=${encodeURIComponent(countryName)}`
                    );
                    const cities = citiesRes.data;
                    for (let c of cities) {
                        const cityName = c.city;
                        const cityCoords = await geocodeLocation(`${cityName}, ${stateName}, ${countryName}`);
                        if (!cityCoords || !bounds.contains(new window.google.maps.LatLng(cityCoords.lat, cityCoords.lng))) {
                            continue;
                        }
                        const aqiValue = getMockAQI();
                        newMarkers.push({
                            position: cityCoords,
                            label: {
                                text: String(aqiValue),
                                color: "#fff",
                                fontSize: "12px",
                                fontWeight: "bold",
                            },
                            icon: {
                                path: window.google.maps.SymbolPath.CIRCLE,
                                fillColor: getAQIColor(aqiValue),
                                fillOpacity: 1,
                                strokeColor: "#000",
                                strokeWeight: 1,
                                scale: 10,
                            },
                            title: `${cityName}, ${stateName}\nAQI: ${aqiValue}`,
                        });
                    }
                }
            }
            setMarkers(newMarkers);
        } catch (error) {
            console.error("Error loading cities:", error);
        }
    };

    // Handle zoom changes on the map
    const onMapLoad = (mapInstance) => {
        setMapRef(mapInstance);
        // Listen for zoom change events with debounce
        mapInstance.addListener("zoom_changed", () => {
            // Clear any previous timeout
            if (zoomDebounceRef.current) {
                clearTimeout(zoomDebounceRef.current);
            }
            // Set a new timeout (e.g., 500ms delay)
            zoomDebounceRef.current = setTimeout(() => {
                const zoom = mapInstance.getZoom();
                console.log("Debounced Zoom level:", zoom);
                clearMarkers();
                const bounds = mapInstance.getBounds();
                console.log({ bounds })
                if (zoom <= ZOOM_COUNTRY) {
                    loadCountries();
                } else if (zoom <= ZOOM_STATE) {
                    loadStatesForView(bounds);
                } else {
                    loadCitiesForView(bounds);
                }
            }, 500);
        });
    };


    return (
        <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={2}
                onLoad={onMapLoad}
            >
                {markers.map((marker, idx) => (
                    <Marker
                        key={idx}
                        position={marker.position}
                        label={marker.label}
                        icon={marker.icon}
                        title={marker.title}
                    />
                ))}
            </GoogleMap>
        </LoadScript>
    );
}

export default function App() {
    return <AirQualityMap />;
}
