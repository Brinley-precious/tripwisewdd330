const COUNTRIES_API_URL = "https://countries.dev";

const FEATURED_COUNTRIES = [
    "Japan",
    "South Africa",
    "France"
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

    if ("requestIdleCallback" in window) {
        requestIdleCallback(loadFeaturedDestinations);
    } else {
        setTimeout(loadFeaturedDestinations, 100);
    }
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

        menuButton.setAttribute("aria-expanded", isOpen);
    });
}

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

async function loadFeaturedDestinations() {
    const container = document.querySelector("#featured-destinations");

    if (!container) {
        return;
    }

    try {
        const countries = await Promise.all(
            FEATURED_COUNTRIES.map(fetchCountry)
        );

        container.innerHTML = countries
            .map(createDestinationCard)
            .join("");
    } catch (error) {
        console.error("Featured destinations error:", error);

        container.innerHTML = `
            <p class="search-status">
                We couldn't load the destinations right now. Please try again.
            </p>
        `;
    }
}

function createDestinationCard(country) {
    const name = country.name || "Unknown destination";

    const capital = Array.isArray(country.capital)
        ? country.capital[0] || "Capital unavailable"
        : country.capital || "Capital unavailable";

    const region = country.region || "Region unavailable";
    const image = COUNTRY_IMAGES[name] || "";

    return `
        <article class="destination-card">

            <img
                class="destination-card-image"
                src="${image}"
                alt="Scenic view of ${name}"
                loading="lazy"
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
        } catch (error) {
            console.error("Destination search error:", error);

            status.textContent =
                "We couldn't find that country. Try a country name such as Japan or France.";
        }
    });
}