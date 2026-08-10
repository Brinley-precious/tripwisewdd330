import {
    addFavourite,
    removeFavourite,
    isFavourite
} from "./storage.js";

import { fetchCountry } from "./countriesapi.js";
import { fetchWeather } from "./weatherapi.js";
import { fetchPlaces } from "./placesapi.js";


const DEFAULT_DESTINATION = "South Africa";
const PLACES_LIMIT = 6;


const destinationStatus =
    document.querySelector("#destination-status");

const destinationStatusSection =
    document.querySelector(".destination-status-section");

const destinationDetails =
    document.querySelector("#destination-details");

const destinationName =
    document.querySelector("#destination-name");

const destinationRegion =
    document.querySelector("#destination-region");

const destinationDescription =
    document.querySelector("#destination-description");

const destinationFlag =
    document.querySelector("#destination-flag");

const countryCapital =
    document.querySelector("#country-capital");

const countryRegion =
    document.querySelector("#country-region");

const countryPopulation =
    document.querySelector("#country-population");

const countryArea =
    document.querySelector("#country-area");

const countryCurrency =
    document.querySelector("#country-currency");

const countryLanguages =
    document.querySelector("#country-languages");

const favouriteButton =
    document.querySelector("#favourite-button");


document.addEventListener(
    "DOMContentLoaded",
    () => {
        updateCurrentYear();
        setupMobileMenu();
        loadDestination();
        setupScrollAnimations();
    }
);


/* =========================
   GENERAL PAGE FUNCTIONS
========================= */

function updateCurrentYear() {

    const yearElement =
        document.querySelector("#current-year");

    if (yearElement) {
        yearElement.textContent =
            new Date().getFullYear();
    }
}


function setupMobileMenu() {

    const menuButton =
        document.querySelector(".menu-button");

    const navigation =
        document.querySelector("#site-navigation");

    if (!menuButton || !navigation) {
        return;
    }

    menuButton.addEventListener(
        "click",
        () => {

            const isOpen =
                navigation.classList.toggle("open");

            menuButton.setAttribute(
                "aria-expanded",
                String(isOpen)
            );
        }
    );
}


function getCountryFromUrl() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const value =
        params.get("country");

    if (!value) {
        return null;
    }

    const parts =
        value.split(",");

    return parts[
        parts.length - 1
    ].trim();
}


/* =========================
   COUNTRY DATA
========================= */

function getCapital(country) {

    if (Array.isArray(country.capital)) {
        return country.capital[0] ||
            "Capital unavailable";
    }

    return country.capital ||
        "Capital unavailable";
}


function getCurrency(country) {

    if (
        !country.currencies ||
        typeof country.currencies !== "object"
    ) {
        return "Currency unavailable";
    }

    const currencies =
        Object.values(country.currencies);

    if (!currencies.length) {
        return "Currency unavailable";
    }

    const currency =
        currencies[0];

    if (
        currency.name &&
        currency.symbol
    ) {
        return `${currency.name} (${currency.symbol})`;
    }

    return (
        currency.name ||
        currency.symbol ||
        "Currency unavailable"
    );
}


function getLanguages(country) {

    if (
        !country.languages ||
        typeof country.languages !== "object"
    ) {
        return "Languages unavailable";
    }

    const languages =
        Object.values(country.languages)
            .map(language => {

                if (typeof language === "string") {
                    return language;
                }

                if (
                    language &&
                    typeof language === "object"
                ) {
                    return (
                        language.name ||
                        language.common ||
                        ""
                    );
                }

                return "";
            })
            .filter(Boolean);

    return languages.length
        ? languages.join(", ")
        : "Languages unavailable";
}


function formatNumber(value) {

    if (typeof value !== "number") {
        return "Unavailable";
    }

    return new Intl.NumberFormat(
        "en-US"
    ).format(value);
}


function createDescription(country) {

    const name =
        country.name ||
        "This destination";

    const region =
        country.region ||
        "this region";

    const capital =
        getCapital(country);

    return `${name} is a destination in ${region}, with ${capital} as its capital. Explore the country details below and start building your TripWise plans.`;
}


function displayDestination(country) {

    const name =
        country.name ||
        "Unknown destination";

    const region =
        country.region ||
        "Region unavailable";

    destinationName.textContent =
        name;

    destinationRegion.textContent =
        region.toUpperCase();

    destinationDescription.textContent =
        createDescription(country);

    countryCapital.textContent =
        getCapital(country);

    countryRegion.textContent =
        region;

    countryPopulation.textContent =
        formatNumber(country.population);

    countryArea.textContent =
        typeof country.area === "number"
            ? `${formatNumber(country.area)} km²`
            : "Area unavailable";

    countryCurrency.textContent =
        getCurrency(country);

    countryLanguages.textContent =
        getLanguages(country);


    if (
        country.flags?.svg ||
        country.flags?.png
    ) {

        destinationFlag.src =
            country.flags.svg ||
            country.flags.png;

        destinationFlag.alt =
            `Flag of ${name}`;
    }


    destinationFlag.width = 400;
    destinationFlag.height = 300;

    destinationDetails.hidden = false;


    if (destinationStatusSection) {
        destinationStatusSection.hidden = true;
    }


    setupFavouriteButton(
        name,
        country.flags?.svg ||
        country.flags?.png
    );

    loadWeather(country);

    loadPlaces(country);
}


/* =========================
   WEATHER
========================= */

async function loadWeather(country) {

    const countryName =
        country.name ||
        DEFAULT_DESTINATION;

    const capital =
        getCapital(country);

    const weatherLocation =
        document.querySelector("#weather-location");

    const weatherContainer =
        document.querySelector("#weather-container");


    if (weatherLocation) {
        weatherLocation.textContent =
            `Checking the forecast for ${capital}...`;
    }


    if (weatherContainer) {
        weatherContainer.innerHTML =
            "<p>Loading weather information...</p>";
    }


    try {

        const weatherData =
            await fetchWeather(capital);

        displayWeather(
            weatherData,
            countryName
        );

    } catch (error) {

        console.error(
            "Weather loading error:",
            error
        );

        if (weatherLocation) {
            weatherLocation.textContent =
                `Weather information for ${countryName}.`;
        }

        if (weatherContainer) {

            weatherContainer.innerHTML = `
                <div class="destination-placeholder-card">
                    <span class="feature-icon" aria-hidden="true">
                        ☁️
                    </span>

                    <h3>Weather unavailable</h3>

                    <p>
                        We couldn't load the current weather
                        right now. Please try again later.
                    </p>
                </div>
            `;
        }
    }
}


function displayWeather(
    weatherData,
    countryName
) {

    const weatherLocation =
        document.querySelector("#weather-location");

    const weatherContainer =
        document.querySelector("#weather-container");


    if (!weatherContainer) {
        return;
    }


    const current =
        weatherData.current;

    const location =
        weatherData.location;


    if (weatherLocation) {

        weatherLocation.textContent =
            `Current weather in ${location.name}, ${countryName}.`;
    }


    const temperature =
        Math.round(
            current.temperature_2m
        );

    const feelsLike =
        Math.round(
            current.apparent_temperature
        );

    const humidity =
        Math.round(
            current.relative_humidity_2m
        );

    const windSpeed =
        Math.round(
            current.wind_speed_10m
        );

    const precipitation =
        current.precipitation ?? 0;

    const description =
        getWeatherDescription(
            current.weather_code
        );


    weatherContainer.innerHTML = `
        <div class="destination-placeholder-card weather-card">

            <span
                class="feature-icon"
                aria-hidden="true">
                ${getWeatherIcon(current.weather_code)}
            </span>

            <p class="eyebrow">
                CURRENT CONDITIONS
            </p>

            <h3>
                ${temperature}°C · ${description}
            </h3>

            <div class="weather-details">

                <p>
                    <strong>Feels like:</strong>
                    ${feelsLike}°C
                </p>

                <p>
                    <strong>Humidity:</strong>
                    ${humidity}%
                </p>

                <p>
                    <strong>Wind:</strong>
                    ${windSpeed} km/h
                </p>

                <p>
                    <strong>Precipitation:</strong>
                    ${precipitation} mm
                </p>

            </div>

        </div>
    `;
}


function getWeatherDescription(code) {

    const descriptions = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Foggy",
        48: "Depositing rime fog",
        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Dense drizzle",
        56: "Light freezing drizzle",
        57: "Dense freezing drizzle",
        61: "Light rain",
        63: "Moderate rain",
        65: "Heavy rain",
        66: "Light freezing rain",
        67: "Heavy freezing rain",
        71: "Light snowfall",
        73: "Moderate snowfall",
        75: "Heavy snowfall",
        77: "Snow grains",
        80: "Light rain showers",
        81: "Moderate rain showers",
        82: "Violent rain showers",
        85: "Light snow showers",
        86: "Heavy snow showers",
        95: "Thunderstorm",
        96: "Thunderstorm with hail",
        99: "Thunderstorm with heavy hail"
    };

    return (
        descriptions[code] ||
        "Weather unavailable"
    );
}


function getWeatherIcon(code) {

    if (code === 0) {
        return "☀️";
    }

    if ([1, 2].includes(code)) {
        return "🌤️";
    }

    if ([3, 45, 48].includes(code)) {
        return "☁️";
    }

    if (
        [
            51, 53, 55, 56, 57,
            61, 63, 65, 66, 67,
            80, 81, 82
        ].includes(code)
    ) {
        return "🌧️";
    }

    if (
        [71, 73, 75, 77, 85, 86]
            .includes(code)
    ) {
        return "❄️";
    }

    if ([95, 96, 99].includes(code)) {
        return "⛈️";
    }

    return "🌍";
}


/* =========================
   PLACES
========================= */

async function loadPlaces(country) {

    const destination =
        country.name ||
        getCapital(country);

    const placesContainer =
        document.querySelector("#places-container");


    if (!placesContainer) {
        return;
    }


    placesContainer.innerHTML = `
        <p>
            Finding places worth exploring...
        </p>
    `;


    try {

        const data =
            await fetchPlaces(
                destination,
                PLACES_LIMIT
            );


        displayPlaces(
            data.places
        );

    } catch (error) {

        console.error(
            "Places loading error:",
            error
        );

        placesContainer.innerHTML = `
            <div class="destination-placeholder-card">

                <span
                    class="feature-icon"
                    aria-hidden="true">
                    📍
                </span>

                <h3>
                    Places unavailable
                </h3>

                <p>
                    We couldn't load places to explore right now.
                    Please try again later.
                </p>

            </div>
        `;
    }
}


function displayPlaces(places) {

    const placesContainer =
        document.querySelector("#places-container");


    if (!placesContainer) {
        return;
    }


    if (
        !Array.isArray(places) ||
        places.length === 0
    ) {

        placesContainer.innerHTML = `
            <div class="destination-placeholder-card">

                <span
                    class="feature-icon"
                    aria-hidden="true">
                    📍
                </span>

                <h3>
                    No places found
                </h3>

                <p>
                    We couldn't find attractions for this
                    destination right now.
                </p>

            </div>
        `;

        return;
    }


    /*
     * Remove duplicate places.
     */
    const uniquePlaces =
        places.filter(
            (place, index, array) => {

                const key =
                    `${place.name}-${place.latitude}-${place.longitude}`
                        .toLowerCase();

                return (
                    index ===
                    array.findIndex(
                        item =>
                            `${item.name}-${item.latitude}-${item.longitude}`
                                .toLowerCase() === key
                    )
                );
            }
        );


    const cards =
        uniquePlaces
            .slice(0, PLACES_LIMIT)
            .map(createPlaceCard)
            .filter(Boolean);


    if (!cards.length) {

        placesContainer.innerHTML = `
            <div class="destination-placeholder-card">

                <span
                    class="feature-icon"
                    aria-hidden="true">
                    📍
                </span>

                <h3>
                    No places found
                </h3>

                <p>
                    We couldn't find attractions for this
                    destination right now.
                </p>

            </div>
        `;

        return;
    }


    placesContainer.innerHTML =
        cards.join("");
}


function createPlaceCard(place) {

    if (!place) {
        return "";
    }

    const name =
        typeof place.name === "string"
            ? place.name.trim()
            : "";

    if (!name) {
        return "";
    }

    const category =
        place.category ||
        "PLACE TO EXPLORE";

    const address =
        place.address ||
        place.city ||
        "Address unavailable";

    const description =
        typeof place.description === "string" &&
            place.description.trim()
            ? place.description.trim()
            : "Discover more about this place and what it has to offer.";

    const website =
        typeof place.website === "string"
            ? place.website.trim()
            : "";

    const wikipedia =
        typeof place.wikipedia === "string"
            ? place.wikipedia.trim()
            : "";

    const map =
        typeof place.map === "string"
            ? place.map.trim()
            : "";

    const latitude =
        typeof place.latitude === "number"
            ? place.latitude
            : Number(place.latitude);

    const longitude =
        typeof place.longitude === "number"
            ? place.longitude
            : Number(place.longitude);

    const safeMap =
        map ||
        (!Number.isNaN(latitude) &&
            !Number.isNaN(longitude)
            ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}`
            : "");

    const websiteHTML =
        website
            ? `
                <a
                    href="${escapeHTML(website)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="place-link"
                >
                    Official website
                </a>
            `
            : "";

    const wikipediaHTML =
        !website && wikipedia
            ? `
                <a
                    href="${escapeHTML(wikipedia)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="place-link"
                >
                    Learn more
                </a>
            `
            : "";

    const mapHTML =
        safeMap
            ? `
                <a
                    href="${escapeHTML(safeMap)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="place-link secondary"
                >
                    View on map
                </a>
            `
            : "";

    return `
        <article class="place-card">

            <div class="place-card-content">

                <p class="eyebrow">
                    ${escapeHTML(category)}
                </p>

                <h3>
                    ${escapeHTML(name)}
                </h3>

                <p class="place-card-address">
                    ${escapeHTML(address)}
                </p>

                <p class="place-card-description">
                    ${escapeHTML(description)}
                </p>

                <div class="place-card-actions">
                    ${websiteHTML}
                    ${wikipediaHTML}
                    ${mapHTML}
                </div>

            </div>

        </article>
    `;
}


/* =========================
   FAVOURITES
========================= */

function setupFavouriteButton(
    countryName,
    countryFlag = ""
) {

    if (
        !favouriteButton ||
        !countryName
    ) {
        return;
    }

    updateFavouriteButton(
        countryName
    );

    favouriteButton.onclick =
        () => {

            if (
                isFavourite(countryName)
            ) {

                removeFavourite(
                    countryName
                );

            } else {

                addFavourite({
                    name: countryName,
                    flag: countryFlag
                });
            }

            updateFavouriteButton(
                countryName
            );
        };
}


function updateFavouriteButton(
    countryName
) {

    const saved =
        isFavourite(countryName);


    favouriteButton.setAttribute(
        "aria-pressed",
        String(saved)
    );


    favouriteButton.textContent =
        saved
            ? "Saved Destination"
            : "Save Destination";
}


/* =========================
   ERROR HANDLING
========================= */

function showError(message) {

    if (destinationStatus) {
        destinationStatus.textContent =
            message;
    }


    if (destinationStatusSection) {
        destinationStatusSection.hidden =
            false;
    }


    if (destinationDetails) {
        destinationDetails.hidden =
            true;
    }
}


async function loadDestination() {

    const countryName =
        getCountryFromUrl() ||
        DEFAULT_DESTINATION;


    if (destinationStatus) {
        destinationStatus.textContent =
            "Loading destination...";
    }


    try {

        const country =
            await fetchCountry(
                countryName
            );


        displayDestination(
            country
        );

    } catch (error) {

        console.error(
            "Destination loading error:",
            error
        );


        showError(
            "We couldn't load that destination right now. Please try again."
        );
    }
}


/* =========================
   SCROLL ANIMATIONS
========================= */

function setupScrollAnimations() {

    const cards =
        document.querySelectorAll(
            ".destination-hero, .country-fact-card, .destination-placeholder-card"
        );


    if (
        !("IntersectionObserver" in window)
    ) {

        cards.forEach(
            card =>
                card.classList.add("is-visible")
        );

        return;
    }


    const observer =
        new IntersectionObserver(
            (entries, observerInstance) => {

                entries.forEach(entry => {

                    if (entry.isIntersecting) {

                        entry.target.classList.add(
                            "is-visible"
                        );

                        observerInstance.unobserve(
                            entry.target
                        );
                    }
                });
            },
            {
                threshold: 0.15
            }
        );


    cards.forEach(
        card =>
            observer.observe(card)
    );
}


/* =========================
   HTML SAFETY
========================= */

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}