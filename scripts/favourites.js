import {
    getFavourites,
    removeFavourite,
    getSavedTrips,
    removeSavedTrip
} from "./storage.js";

import {
    updateCurrentYear,
    setupMobileMenu,
    formatDate,
    formatTime,
    escapeHTML
} from "./utils.js";

document.addEventListener("DOMContentLoaded", () => {
    updateCurrentYear();
    setupMobileMenu();
    displayFavourites();
    displaySavedTrips();
    highlightRequestedTrip();
    
});

async function displayFavourites() {
    const container =
        document.querySelector("#favourites-container");

    if (!container) {
        return;
    }

    const favourites = getFavourites();

    if (favourites.length === 0) {
        container.innerHTML = `
            <div class="favourites-empty">

                <div
                    class="favourites-empty-icon"
                    aria-hidden="true">
                    ✈
                </div>

                <p class="eyebrow">
                    NOTHING SAVED YET
                </p>

                <h3>
                    Your next favourite could be out there.
                </h3>

                <p>
                    Explore a destination and save the places
                    you want to keep close.
                </p>

                <a
                    class="button button-primary"
                    href="./destination.html">
                    Explore Destinations
                </a>

            </div>
        `;

        return;
    }

    const favouritesWithFlags =
        await Promise.all(
            favourites.map(async (country) => {

                const existingFlag =
                    country.flag ||
                    country.flags?.svg ||
                    country.flags?.png ||
                    "";

                if (existingFlag) {
                    return country;
                }

                try {
                    const response =
                        await fetch(
                            `https://restcountries.com/v3.1/name/${encodeURIComponent(
                                country.name
                            )}?fields=name,flags`
                        );

                    if (!response.ok) {
                        return country;
                    }

                    const data =
                        await response.json();

                    const countryData =
                        data?.[0];

                    const flag =
                        countryData?.flags?.svg ||
                        countryData?.flags?.png ||
                        "";

                    return {
                        ...country,
                        flag
                    };

                } catch (error) {

                    console.error(
                        `Could not load flag for ${country.name}:`,
                        error
                    );

                    return country;
                }
            })
        );

    container.innerHTML =
        favouritesWithFlags
            .map(createFavouriteCard)
            .join("");

    setupRemoveButtons();
}

function createFavouriteCard(country) {
    const name =
        escapeHTML(
            country.name || "Saved destination"
        );

    const flag =
        country.flag ||
        country.flags?.svg ||
        country.flags?.png ||
        "";

    return `
        <article class="favourite-card">

            <div class="favourite-card-visual">

                ${flag
            ? `
                            <img
                                class="favourite-card-flag"
                                src="${escapeHTML(flag)}"
                                alt="Flag of ${name}"
                                loading="lazy">
                        `
            : `
                            <span
                                class="favourite-card-icon"
                                aria-hidden="true">
                                ✈
                            </span>
                        `
        }

            </div>

            <div class="favourite-card-content">

                <p class="eyebrow">
                    SAVED DESTINATION
                </p>

                <h3>
                    ${name}
                </h3>

                <p>
                    Keep this destination close until you're
                    ready to make it part of your next trip.
                </p>

                <div class="favourite-card-actions">

                    <a
                        class="button button-primary"
                        href="./destination.html?country=${encodeURIComponent(
            country.name || ""
        )}">
                        Explore ${name} ↗
                    </a>

                    <button
                        class="button button-secondary remove-favourite"
                        type="button"
                        data-country="${name}">
                        Remove
                    </button>

                </div>

            </div>

        </article>
    `;
}

function setupRemoveButtons() {
    const removeButtons = document.querySelectorAll(".remove-favourite");

    removeButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const countryName = button.dataset.country;

            removeFavourite(countryName);

            displayFavourites();
        });
    });
}

function displaySavedTrips() {
    const container =
        document.querySelector(
            "#saved-itineraries-container"
        );

    if (!container) {
        return;
    }

    const trips = getSavedTrips();

    if (trips.length === 0) {
        container.innerHTML = `
            <div class="saved-itineraries-empty">
                <p class="eyebrow">
                    NO TRIPS SAVED YET
                </p>

                <h3>
                    Your next adventure starts here.
                </h3>

                <p>
                    Build a personalised itinerary and save it
                    so you can come back to it anytime.
                </p>

                <a
                    class="button button-primary"
                    href="./planner.html">
                    Start Planning
                </a>
            </div>
        `;

        return;
    }

    const params =
        new URLSearchParams(
            window.location.search
        );

    const requestedTripId =
        params.get("trip");

    const tripsToDisplay =
        requestedTripId
            ? trips.filter(
                trip =>
                    String(trip.id) ===
                    String(requestedTripId)
            )
            : trips;

    if (tripsToDisplay.length === 0) {
        container.innerHTML = `
            <div class="saved-itineraries-empty">
                <p class="eyebrow">
                    ITINERARY NOT FOUND
                </p>

                <h3>
                    We couldn't find that saved trip.
                </h3>

                <p>
                    Your other saved itineraries are still available
                    below.
                </p>

                <button
                    class="button button-secondary"
                    type="button"
                    id="show-all-trips">
                    Show All Saved Trips
                </button>
            </div>
        `;

        const showAllButton =
            document.querySelector(
                "#show-all-trips"
            );

        if (showAllButton) {
            showAllButton.addEventListener(
                "click",
                () => {
                    window.history.replaceState(
                        {},
                        "",
                        "./favourites.html"
                    );

                    displaySavedTrips();
                }
            );
        }

        return;
    }

    container.innerHTML =
        tripsToDisplay
            .map(createSavedTripCard)
            .join("");

    setupSavedTripButtons();
    highlightRequestedTrip();
}


function createSavedTripCard(trip) {
    const itinerary =
        Array.isArray(trip.itinerary)
            ? trip.itinerary
            : [];

    const plannedItems =
        itinerary.reduce(
            (total, day) =>
                total +
                (
                    Array.isArray(day.items)
                        ? day.items.length
                        : 0
                ),
            0
        );

    const tripId =
        escapeHTML(
            String(trip.id || "")
        );

    const destination =
        escapeHTML(
            trip.destination || "Trip"
        );

    const dates =
        `${formatDate(trip.startDate)} – ${formatDate(trip.endDate)}`;

    const daysMarkup =
        itinerary.length
            ? itinerary
                .map(
                    (day, index) =>
                        createSavedDay(
                            day,
                            index
                        )
                )
                .join("")
            : `
                <p class="saved-itinerary-no-plans">
                    No activities have been added to this itinerary yet.
                </p>
            `;

    const tripNotes =
        trip.notes ||
        trip.tripNotes ||
        trip.note ||
        "";

    const notesMarkup = `
    <aside class="saved-itinerary-notes">

        <span>TRIP NOTES</span>

        <p>
            ${tripNotes
            ? escapeHTML(tripNotes)
            : "No notes added"
        }
        </p>

    </aside>
`;
    
    const budget =
        trip.budget || {};

    const budgetTotal =
        Number(budget.total) || 0;

    const budgetMarkup =
        budgetTotal > 0
            ? `
            <aside class="saved-itinerary-budget">

                <span>
                    TRIP BUDGET
                </span>

                <strong>
                    ${formatSavedBudget(
                budgetTotal,
                budget.currency || "NGN"
            )}
                </strong>

            </aside>
        `
: "";
    
    return `
        <article
            class="saved-itinerary-card saved-itinerary-detail-card"
            data-trip-id="${tripId}">

            <header class="saved-itinerary-header">

                <div>
                    <p class="eyebrow">
                        SAVED ITINERARY
                    </p>

                    <h3>
                        ${destination}
                    </h3>

                    <p class="saved-itinerary-dates">
                        ${dates}
                    </p>
                </div>

                <div class="saved-itinerary-count">
                    <strong>
                        ${plannedItems}
                    </strong>

                    <span>
                        ${plannedItems === 1
            ? "planned activity"
            : "planned activities"
        }
                    </span>
                </div>

            </header>

            <div class="saved-itinerary-days">
                ${daysMarkup}
            </div>

            ${notesMarkup}
            ${budgetMarkup}

            <footer class="saved-itinerary-footer">

                <span>
                    ${plannedItems === 0
            ? "No activities planned"
            : `${plannedItems} ${plannedItems === 1
                ? "activity"
                : "activities"
            } saved`
        }
                </span>

                <button
                    class="button button-secondary remove-saved-trip"
                    type="button"
                    data-trip-id="${tripId}">
                    Remove Trip
                </button>

            </footer>

        </article>
    `;
}

function createSavedDay(day, index) {
    const items =
        Array.isArray(day.items)
            ? day.items
            : [];

    const dayDate =
        day.date
            ? formatDate(day.date)
            : `Day ${index + 1}`;

    const itemsMarkup =
        items.length
            ? items
                .map(createSavedItineraryItem)
                .join("")
            : `
                <p class="saved-day-empty">
                    No plans added for this day.
                </p>
            `;

    return `
        <section class="saved-itinerary-day">

            <div class="saved-itinerary-day-heading">
                <p class="eyebrow">
                    DAY ${index + 1}
                </p>

                <h4>
                    ${escapeHTML(dayDate)}
                </h4>
            </div>

            <div class="saved-itinerary-items">
                ${itemsMarkup}
            </div>

        </section>
    `;
}


function createSavedItineraryItem(item) {
    const type =
        escapeHTML(
            item.type || "Activity"
        );

    const title =
        escapeHTML(
            item.title || "Planned activity"
        );

    const time =
        item.time
            ? formatTime(item.time)
            : "Time not set";

    const notes =
        item.notes
            ? `
                <p class="saved-item-notes">
                    ${escapeHTML(item.notes)}
                </p>
            `
            : "";

    return `
        <article class="saved-itinerary-item">

            <div class="saved-itinerary-item-time">
                ${escapeHTML(time)}
            </div>

            <div class="saved-itinerary-item-content">

                <span class="saved-itinerary-item-type">
                    ${type}
                </span>

                <h5>
                    ${title}
                </h5>

                ${notes}

            </div>

        </article>
    `;
}

function setupSavedTripButtons() {

    const buttons =
        document.querySelectorAll(
            ".remove-saved-trip"
        );


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const tripId =
                    button.dataset.tripId;

                removeSavedTrip(tripId);

                displaySavedTrips();
            }
        );
    });
}

function highlightRequestedTrip() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const tripId =
        params.get("trip");


    if (!tripId) {
        return;
    }


    const card =
        document.querySelector(
            `[data-trip-id="${CSS.escape(tripId)}"]`
        );


    if (!card) {
        return;
    }


    card.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });


    card.classList.add(
        "saved-itinerary-highlight"
    );
}

function formatSavedBudget(
    amount,
    currency
) {

    try {

        return new Intl.NumberFormat(
            "en-US",
            {
                style: "currency",
                currency,
                maximumFractionDigits: 2
            }
        ).format(amount);

    } catch {

        return `${currency} ${Number(amount).toFixed(2)}`;
    }
}