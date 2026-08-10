const COUNTRIES_API_URL = "https://countries.dev";


export async function fetchCountry(countryName) {
    const url =
        `${COUNTRIES_API_URL}/name/${encodeURIComponent(countryName)}?fields=name,capital,region,subregion,population,area,currencies,languages,flags`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Country request failed: ${response.status}`);
    }

    const countries = await response.json();

    if (!Array.isArray(countries) || countries.length === 0) {
        throw new Error("Country not found.");
    }

    return countries[0];
}

export async function fetchCity(cityName) {
    const url =
        `${COUNTRIES_API_URL}/cities?q=${encodeURIComponent(cityName)}&limit=1`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`City request failed: ${response.status}`);
    }

    const cities = await response.json();

    if (!Array.isArray(cities) || cities.length === 0) {
        throw new Error("City not found.");
    }

    return cities[0];
}