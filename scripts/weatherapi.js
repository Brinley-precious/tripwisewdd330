const GEOCODING_API_URL =
    "https://geocoding-api.open-meteo.com/v1/search";

const WEATHER_API_URL =
    "https://api.open-meteo.com/v1/forecast";


async function getCoordinates(locationName) {
    const url =
        `${GEOCODING_API_URL}?name=${encodeURIComponent(locationName)}&count=1&language=en&format=json`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Location request failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
        throw new Error("Location not found.");
    }

    return data.results[0];
}


export async function fetchWeather(locationName) {
    const location = await getCoordinates(locationName);

    const params = new URLSearchParams({
        latitude: location.latitude,
        longitude: location.longitude,
        current: [
            "temperature_2m",
            "apparent_temperature",
            "relative_humidity_2m",
            "precipitation",
            "weather_code",
            "wind_speed_10m"
        ].join(","),
        daily: [
            "weather_code",
            "temperature_2m_max",
            "temperature_2m_min",
            "precipitation_probability_max"
        ].join(","),
        forecast_days: "5",
        timezone: "auto"
    });

    const response =
        await fetch(`${WEATHER_API_URL}?${params.toString()}`);

    if (!response.ok) {
        throw new Error(`Weather request failed: ${response.status}`);
    }

    const weather = await response.json();

    return {
        location,
        current: weather.current,
        daily: weather.daily
    };
}