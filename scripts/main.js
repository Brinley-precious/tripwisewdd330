import {
    updateCurrentYear,
    setupMobileMenu,
    escapeHTML
} from "./utils.js";

const COUNTRIES_API_URL = "https://countries.dev";

const FEATURED_COUNTRIES = [
    {
        name: "Japan",
        capital: "Tokyo",
        region: "Asia"
    },
    {
        name: "South Africa",
        capital: "Pretoria",
        region: "Africa"
    },
    {
        name: "France",
        capital: "Paris",
        region: "Europe"
    }
];

const COUNTRY_IMAGES = {
    Japan: "./images/japan.webp",
    "South Africa": "./images/south-africa.webp",
    France: "./images/france.webp"
};

document.addEventListener("DOMContentLoaded", () => {
    updateCurrentYear();
    setupMobileMenu();
    setupDestinationSearch();

    // Load featured destinations after the main page has painted and the browser is idle.
    window.addEventListener("load", () => {
        if ("requestIdleCallback" in window) {
            window.requestIdleCallback(() => loadFeaturedDestinations(), { timeout: 2000 });
        } else {
            window.setTimeout(loadFeaturedDestinations, 1200);
        }
    });
});

async function fetchCountry(countryName) {
    const url =
        `${COUNTRIES_API_URL}/name/${encodeURIComponent(countryName)}?fields=name,capital,region`;

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

async function fetchCity(cityName) {
    const url =
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=${encodeURIComponent(cityName)}`;

    const response = await fetch(url, {
        headers: {
            Accept: "application/json"
        }
    });

    if (!response.ok) {
        throw new Error(`City request failed: ${response.status}`);
    }

    const results = await response.json();

    if (!Array.isArray(results) || results.length === 0) {
        throw new Error("City not found.");
    }

    const result = results[0];
    const address = result.address || {};

    return {
        name:
            address.city ||
            address.town ||
            address.municipality ||
            address.village ||
            result.name ||
            cityName,
        country: address.country || ""
    };
}


function createDestinationCard(country) {
    const name = country.name || "Unknown destination";
    const capital = country.capital || "Capital unavailable";
    const region = country.region || "Region unavailable";
    const image = COUNTRY_IMAGES[name] || "";

    return `
        <article class="destination-card">

            <img
                class="destination-card-image"
                src="${image}"
                alt="Scenic view of ${name}"
                loading="lazy"
                decoding="async"
                width="400"
                height="300">

            <div class="destination-card-content">

                <p class="eyebrow">${region}</p>

                <h3>${name}</h3>

                <p>
                    Capital: ${capital}
                </p>

                <a
                    class="button button-secondary"
                    href="./destination.html?country=${encodeURIComponent(name)}">
                    Explore ${name}
                </a>

            </div>

        </article>
    `;
}


async function loadFeaturedDestinations() {
    const container = document.querySelector("#featured-destinations");

    if (!container) {
        return;
    }

    const cards = await Promise.all(
        FEATURED_COUNTRIES.map(async (country) => {
            try {
                const countryDetails = await fetchCountry(country.name);

                return createDestinationCard({
                    ...country,
                    ...countryDetails
                });
            } catch (error) {
                console.warn(
                    "Featured destination lookup failed:",
                    error
                );

                return createDestinationCard(country);
            }
        })
    );

    container.innerHTML = cards.join("");
}


function setupDestinationSearch() {
    const form = document.querySelector("#destination-search-form");
    const input = document.querySelector("#destination-search");
    const status = document.querySelector("#search-status");

    if (!form || !input || !status) {
        return;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const searchTerm = input.value.trim();

        if (!searchTerm) {
            status.textContent =
                "Tell us where you're thinking of going.";

            return;
        }

        status.textContent = "Looking around...";

        try {
            const country = await fetchCountry(searchTerm);
            const countryName = country.name;

            status.innerHTML = `
                Found it. Let's see what ${countryName} has waiting for you.
                <a href="./destination.html?country=${encodeURIComponent(countryName)}">
                    Explore ${countryName}
                </a>
            `;

        } catch (countryError) {

            // If it isn't a country, try searching for a city.
            try {
                const city = await fetchCity(searchTerm);

                const cityName =
                    city.name ||
                    city.city ||
                    searchTerm;

                const countryName =
                    city.country ||
                    city.countryName ||
                    "";

                const destinationCountry =
                    countryName || cityName;

                status.innerHTML = `
                    Found it. Let's see what ${cityName} has waiting for you.
                    <a href="./destination.html?country=${encodeURIComponent(destinationCountry)}">
                        Explore ${cityName}
                    </a>
                `;

            } catch (cityError) {

                console.error(
                    "Destination search error:",
                    cityError
                );

                status.textContent =

                    "We couldn't find that country. Try a country or city name such as Japan or France,Paris,Tokyo.";
            }
        }
    });
}