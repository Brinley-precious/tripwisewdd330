const COUNTRIES_API_URL = "https://countries.dev";

const destinationStatus = document.querySelector("#destination-status");
const destinationStatusSection = document.querySelector(
    ".destination-status-section"
);
const destinationDetails = document.querySelector("#destination-details");

const destinationName = document.querySelector("#destination-name");
const destinationRegion = document.querySelector("#destination-region");
const destinationDescription = document.querySelector(
    "#destination-description"
);
const destinationFlag = document.querySelector("#destination-flag");

const countryCapital = document.querySelector("#country-capital");
const countryRegion = document.querySelector("#country-region");
const countryPopulation = document.querySelector("#country-population");
const countryArea = document.querySelector("#country-area");
const countryCurrency = document.querySelector("#country-currency");
const countryLanguages = document.querySelector("#country-languages");

const favouriteButton = document.querySelector("#favourite-button");

document.addEventListener("DOMContentLoaded", () => {
    updateCurrentYear();
    setupMobileMenu();
    setupFavouriteButton();
    loadDestination();
    setupScrollAnimations();
});


function updateCurrentYear() {
    const yearElement = document.querySelector("#current-year");

    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}


function setupMobileMenu() {
    const menuButton = document.querySelector(".menu-button");
    const navigation = document.querySelector("#site-navigation");

    if (!menuButton || !navigation) {
        return;
    }

    menuButton.addEventListener("click", () => {
        const isOpen = navigation.classList.toggle("open");

        menuButton.setAttribute("aria-expanded", String(isOpen));
    });
}


function getCountryFromUrl() {
    const params = new URLSearchParams(window.location.search);

    return params.get("country");
}


async function fetchCountry(countryName) {
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


function getCapital(country) {
    if (Array.isArray(country.capital)) {
        return country.capital[0] || "Capital unavailable";
    }

    return country.capital || "Capital unavailable";
}


function getCurrency(country) {
    if (!country.currencies || typeof country.currencies !== "object") {
        return "Currency unavailable";
    }

    const currencies = Object.values(country.currencies);

    if (currencies.length === 0) {
        return "Currency unavailable";
    }

    const currency = currencies[0];

    if (currency.name && currency.symbol) {
        return `${currency.name} (${currency.symbol})`;
    }

    return currency.name || currency.symbol || "Currency unavailable";
}


function getLanguages(country) {
    if (!country.languages || typeof country.languages !== "object") {
        return "Languages unavailable";
    }

    const languages = Object.values(country.languages)
        .map((language) => {
            if (typeof language === "string") {
                return language;
            }

            if (language && typeof language === "object") {
                return language.name || language.common || "";
            }

            return "";
        })
        .filter(Boolean);

    return languages.length > 0
        ? languages.join(", ")
        : "Languages unavailable";
}


function formatNumber(value) {
    if (typeof value !== "number") {
        return "Unavailable";
    }

    return new Intl.NumberFormat("en-US").format(value);
}


function createDescription(country) {
    const name = country.name || "This destination";
    const region = country.region || "this region";
    const capital = getCapital(country);

    return `${name} is a destination in ${region}, with ${capital} as its capital. Explore the country details below and start building your TripWise plans.`;
}


function displayDestination(country) {
    const name = country.name || "Unknown destination";
    const region = country.region || "Region unavailable";

    destinationName.textContent = name;
    destinationRegion.textContent = region.toUpperCase();

    destinationDescription.textContent = createDescription(country);

    countryCapital.textContent = getCapital(country);
    countryRegion.textContent = region;

    countryPopulation.textContent = formatNumber(country.population);

    countryArea.textContent =
        typeof country.area === "number"
            ? `${formatNumber(country.area)} km²`
            : "Area unavailable";

    countryCurrency.textContent = getCurrency(country);
    countryLanguages.textContent = getLanguages(country);

    if (country.flags?.svg || country.flags?.png) {
        destinationFlag.src = country.flags.svg || country.flags.png;
        destinationFlag.alt = `Flag of ${name}`;
    }

    destinationFlag.width = 400;
    destinationFlag.height = 300;

    destinationDetails.hidden = false;

    if (destinationStatusSection) {
        destinationStatusSection.hidden = true;
    }

    setupDestinationLinks(name);
}


function setupDestinationLinks(countryName) {
    const weatherLocation = document.querySelector("#weather-location");

    if (weatherLocation) {
        weatherLocation.textContent =
            `Weather information for ${countryName} will appear here.`;
    }

    const weatherContainer = document.querySelector("#weather-container");

    if (weatherContainer) {
        weatherContainer.innerHTML = `
            <div class="destination-placeholder-card">
                <span class="feature-icon" aria-hidden="true">☀️</span>
                <h3>Weather coming next</h3>
                <p>
                    We'll connect TripWise to a weather service here so you
                    can check conditions before you pack.
                </p>
            </div>
        `;
    }

    const placesContainer = document.querySelector("#places-container");

    if (placesContainer) {
        placesContainer.innerHTML = `
            <div class="destination-placeholder-card">
                <span class="feature-icon" aria-hidden="true">📍</span>
                <h3>Places coming next</h3>
                <p>
                    We'll add destination experiences here so you can discover
                    things worth doing in ${countryName}.
                </p>
            </div>
        `;
    }
}


function setupFavouriteButton() {
    if (!favouriteButton) {
        return;
    }

    favouriteButton.addEventListener("click", () => {
        const isSaved =
            favouriteButton.getAttribute("aria-pressed") === "true";

        favouriteButton.setAttribute(
            "aria-pressed",
            String(!isSaved)
        );

        favouriteButton.textContent = isSaved
            ? "Save Destination"
            : "Saved Destination";
    });
}

function showError(message) {
    if (!destinationStatus) {
        return;
    }

    destinationStatus.textContent = message;

    if (destinationStatusSection) {
        destinationStatusSection.hidden = false;
    }

    if (destinationDetails) {
        destinationDetails.hidden = true;
    }
}

async function loadDestination() {
    const countryName = getCountryFromUrl();

    if (!countryName) {
        showError(
            "Choose a destination from the Destinations page to start exploring."
        );

        return;
    }

    destinationStatus.textContent = "Loading destination...";

    try {
        const country = await fetchCountry(countryName);

        displayDestination(country);
    } catch (error) {
        console.error("Destination loading error:", error);

        showError(
            "We couldn't load that destination right now. Please try another country."
        );
    }
}

function setupScrollAnimations() {
    const cards = document.querySelectorAll(
        ".destination-hero, .country-fact-card, .destination-placeholder-card"
    );

    if (!("IntersectionObserver" in window)) {
        cards.forEach((card) => card.classList.add("is-visible"));
        return;
    }

    const observer = new IntersectionObserver(
        (entries, observerInstance) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    observerInstance.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.15, // Triggers when 15% of the hero section is visible
        }
    );

    cards.forEach((card) => observer.observe(card));
}