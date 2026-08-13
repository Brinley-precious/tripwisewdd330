import {
    saveTrip,
    getSavedTrips,
    removeSavedTrip
} from "./storage.js";

import {
    updateCurrentYear,
    setupMobileMenu,
    formatDate,
    formatDateForStorage,
    escapeHTML
} from "./utils.js";

document.addEventListener("DOMContentLoaded", () => {
    updateCurrentYear();
    setupMobileMenu();
    setupPlanner();
    setupBudgetCalculator();
    loadSavedTrip();
});

/* =========================
   PLANNER SETUP
========================= */

function setupPlanner() {

    const form =
        document.querySelector("#trip-form");

    if (!form) {
        return;
    }

    const startInput =
        document.querySelector("#trip-start");

    const endInput =
        document.querySelector("#trip-end");

    const destinationInput =
        document.querySelector("#trip-destination");

    const notesInput =
        document.querySelector("#trip-notes");


    if (startInput && endInput) {

        startInput.addEventListener(
            "change",
            updateItinerary
        );

        endInput.addEventListener(
            "change",
            updateItinerary
        );
    }


    if (destinationInput) {

        destinationInput.addEventListener(
            "input",
            updateSummary
        );
    }


    if (notesInput) {

        notesInput.addEventListener(
            "input",
            updateSummary
        );
    }


    form.addEventListener(
        "submit",
        handlePlannerSubmit
    );
    setupBudgetCalculator();
}


/* =========================
   ITINERARY GENERATION
========================= */

function updateItinerary() {

    const startInput =
        document.querySelector("#trip-start");

    const endInput =
        document.querySelector("#trip-end");

    if (
        !startInput ||
        !endInput
    ) {
        return;
    }


    const startDate =
        startInput.value;

    const endDate =
        endInput.value;


    if (!startDate || !endDate) {

        renderEmptyItinerary(
            "Select your start and end dates to build your itinerary."
        );

        updateSummary();

        return;
    }


    if (endDate < startDate) {

        renderEmptyItinerary(
            "Your end date can't be before your start date."
        );

        updateSummary();

        return;
    }


    const existingItinerary =
        collectCurrentItinerary();


    const days =
        createItineraryDays(
            startDate,
            endDate,
            existingItinerary
        );


    renderItinerary(days);

    updateSummary();
}


function createItineraryDays(
    startDate,
    endDate,
    existingItinerary = []
) {

    const days = [];

    const current =
        new Date(`${startDate}T00:00:00`);

    const end =
        new Date(`${endDate}T00:00:00`);


    while (current <= end) {

        const date =
            formatDateForStorage(current);

        const existingDay =
            existingItinerary.find(
                day => day.date === date
            );


        days.push({
            date,
            items:
                existingDay?.items || []
        });


        current.setDate(
            current.getDate() + 1
        );
    }


    return days;
}


/* =========================
   ITINERARY DISPLAY
========================= */

function renderItinerary(days) {

    const container =
        document.querySelector(
            "#itinerary-container"
        );

    if (!container) {
        return;
    }


    if (!days.length) {

        renderEmptyItinerary(
            "Select your start and end dates to build your itinerary."
        );

        return;
    }


    container.innerHTML =
        days.map(
            (day, index) =>
                createDayHTML(
                    day,
                    index
                )
        ).join("");


    setupItineraryButtons();

    updateSummary();
}


function createDayHTML(day, index) {

    const dayNumber =
        index + 1;

    const itemsHTML =
        day.items.length
            ? day.items
                .map(
                    (item, itemIndex) =>
                        createItineraryItemHTML(
                            item,
                            itemIndex,
                            day.date
                        )
                )
                .join("")
            : `
                <p class="day-empty">
                    No plans added yet. Add something you want
                    to do on this day.
                </p>
            `;


    return `
        <article
            class="itinerary-day"
            data-date="${escapeHTML(day.date)}"
        >

            <div class="itinerary-day-header">

                <div>

                    <p class="eyebrow">
                        DAY ${dayNumber}
                    </p>

                    <h4>
                        ${formatDate(day.date)}
                    </h4>

                </div>

            </div>


            <div class="itinerary-items">

                ${itemsHTML}

            </div>


            <button
                type="button"
                class="button button-secondary add-itinerary-item"
            >
                + Add to this day
            </button>

        </article>
    `;
}


function createItineraryItemHTML(
    item,
    index,
    date = ""
) {

    const safeDate =
        String(date)
            .replace(/[^a-zA-Z0-9_-]/g, "-");

    const itemId =
        `${safeDate}-${index}`;


    return `
        <div
            class="itinerary-item"
            data-item-index="${index}"
        >

            <div class="itinerary-item-grid">

                <div class="form-group">

                    <label for="itinerary-type-${itemId}">
                        Type
                    </label>

                    <select
                        id="itinerary-type-${itemId}"
                        name="itineraryType-${itemId}"
                        class="itinerary-item-type"
                    >

                        <option
                            value="Attraction"
                            ${item.type === "Attraction" ? "selected" : ""}
                        >
                            Attraction
                        </option>

                        <option
                            value="Activity"
                            ${item.type === "Activity" ? "selected" : ""}
                        >
                            Activity
                        </option>

                        <option
                            value="Meal"
                            ${item.type === "Meal" ? "selected" : ""}
                        >
                            Meal
                        </option>

                        <option
                            value="Other"
                            ${item.type === "Other" ? "selected" : ""}
                        >
                            Other
                        </option>

                    </select>

                </div>


                <div class="form-group">

                    <label for="itinerary-title-${itemId}">
                        What are you doing?
                    </label>

                    <input
                        type="text"
                        id="itinerary-title-${itemId}"
                        name="itineraryTitle-${itemId}"
                        class="itinerary-item-title"
                        value="${escapeHTML(item.title || "")}"
                        placeholder="e.g. Visit the Eiffel Tower"
                        autocomplete="off"
                    >

                </div>


                <div class="form-group">

                    <label for="itinerary-time-${itemId}">
                        Time
                    </label>

                    <input
                        type="time"
                        id="itinerary-time-${itemId}"
                        name="itineraryTime-${itemId}"
                        class="itinerary-item-time"
                        value="${escapeHTML(item.time || "")}"
                    >

                </div>

            </div>


            <div class="form-group">

                <label for="itinerary-notes-${itemId}">
                    Notes
                </label>

                <textarea
                    id="itinerary-notes-${itemId}"
                    name="itineraryNotes-${itemId}"
                    class="itinerary-item-notes"
                    rows="3"
                    placeholder="Add details for this plan..."
                >${escapeHTML(item.notes || "")}</textarea>

            </div>


            <button
                type="button"
                class="remove-itinerary-item"
            >
                Remove
            </button>

        </div>
    `;
}


/* =========================
   ITINERARY BUTTONS
========================= */

function setupItineraryButtons() {

    const container =
        document.querySelector(
            "#itinerary-container"
        );

    if (!container) {
        return;
    }


    container
        .querySelectorAll(
            ".add-itinerary-item"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const day =
                        button.closest(
                            ".itinerary-day"
                        );

                    if (!day) {
                        return;
                    }

                    addItineraryItem(day);
                }
            );
        });


    container
        .querySelectorAll(
            ".remove-itinerary-item"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const item =
                        button.closest(
                            ".itinerary-item"
                        );

                    if (!item) {
                        return;
                    }

                    item.remove();

                    updateDayEmptyState();

                    updateSummary();
                }
            );
        });


    container
        .querySelectorAll(
            "input, textarea, select"
        )
        .forEach(field => {

            field.addEventListener(
                "input",
                updateSummary
            );

            field.addEventListener(
                "change",
                updateSummary
            );
        });
}


function addItineraryItem(day) {

    const itemsContainer =
        day.querySelector(
            ".itinerary-items"
        );

    if (!itemsContainer) {
        return;
    }


    const emptyMessage =
        itemsContainer.querySelector(
            ".day-empty"
        );

    if (emptyMessage) {
        emptyMessage.remove();
    }


    const wrapper =
        document.createElement("div");

    wrapper.innerHTML =
        createItineraryItemHTML(
            {
                type: "Activity",
                title: "",
                time: "",
                notes: ""
            },
            itemsContainer
                .querySelectorAll(
                    ".itinerary-item"
            ).length,
            day.dataset.date
       );


    const item =
        wrapper.firstElementChild;

    itemsContainer.appendChild(item);


    setupItineraryItemEvents(item);

    updateSummary();
}


function setupItineraryItemEvents(item) {

    item.querySelectorAll(
        "input, textarea, select"
    ).forEach(field => {

        field.addEventListener(
            "input",
            updateSummary
        );

        field.addEventListener(
            "change",
            updateSummary
        );
    });


    const removeButton =
        item.querySelector(
            ".remove-itinerary-item"
        );

    if (removeButton) {

        removeButton.addEventListener(
            "click",
            () => {

                item.remove();

                updateDayEmptyState();

                updateSummary();
            }
        );
    }
}


function updateDayEmptyState() {

    document
        .querySelectorAll(
            ".itinerary-day"
        )
        .forEach(day => {

            const items =
                day.querySelectorAll(
                    ".itinerary-item"
                );

            const itemsContainer =
                day.querySelector(
                    ".itinerary-items"
                );

            if (!itemsContainer) {
                return;
            }


            const emptyMessage =
                itemsContainer.querySelector(
                    ".day-empty"
                );


            if (!items.length && !emptyMessage) {

                itemsContainer.insertAdjacentHTML(
                    "afterbegin",
                    `
                        <p class="day-empty">
                            No plans added yet. Add something you want
                            to do on this day.
                        </p>
                    `
                );
            }


            if (items.length && emptyMessage) {
                emptyMessage.remove();
            }
        });
}


/* =========================
   COLLECT ITINERARY
========================= */

function collectCurrentItinerary() {

    const days =
        document.querySelectorAll(
            ".itinerary-day"
        );


    return Array.from(days)
        .map(day => {

            const date =
                day.dataset.date;


            const items =
                Array.from(
                    day.querySelectorAll(
                        ".itinerary-item"
                    )
                )
                    .map(item => {

                        const type =
                            item.querySelector(
                                ".itinerary-item-type"
                            )?.value || "Activity";

                        const title =
                            item.querySelector(
                                ".itinerary-item-title"
                            )?.value.trim() || "";

                        const time =
                            item.querySelector(
                                ".itinerary-item-time"
                            )?.value || "";

                        const notes =
                            item.querySelector(
                                ".itinerary-item-notes"
                            )?.value.trim() || "";


                        return {
                            type,
                            title,
                            time,
                            notes
                        };
                    })
                    .filter(
                        item =>
                            item.title ||
                            item.notes
                    );


            return {
                date,
                items
            };
        });
}

/* =========================
   TRIP BUDGET
========================= */

const POPULAR_CURRENCIES = [
    "NGN",
    "USD",
    "EUR",
    "GBP",
    "ZAR",
    "CAD",
    "AUD",
    "JPY"
];


function setupBudgetCalculator() {

    const fields =
        document.querySelectorAll(
            "[data-budget-field]"
        );

    const currency =
        document.querySelector(
            "#budget-currency"
        );

    const total =
        document.querySelector(
            "#budget-total"
        );

    const resetButton =
        document.querySelector(
            "#budget-reset"
        );

    const useTripButton =
        document.querySelector(
            "#budget-use-trip"
        );

    if (!fields.length || !total) {
        return;
    }

    populateCurrencyOptions();

    function updateBudget() {

        const amount =
            Array.from(fields)
                .reduce(
                    (sum, field) =>
                        sum +
                        normaliseBudgetAmount(
                            field.value
                        ),
                    0
                );

        total.textContent =
            formatBudgetCurrency(
                amount,
                currency?.value || "NGN"
            );
    }


    fields.forEach(field => {

        field.addEventListener(
            "input",
            updateBudget
        );

        field.addEventListener(
            "change",
            updateBudget
        );
    });


    currency?.addEventListener(
        "change",
        updateBudget
    );


    resetButton?.addEventListener(
        "click",
        () => {

            fields.forEach(
                field => {
                    field.value = "";
                }
            );

            if (currency) {
                currency.value = "NGN";
            }

            updateBudget();

            updateBudgetSummary();

            showPlannerStatus(
                "Your trip budget has been reset."
            );
        }
    );


    useTripButton?.addEventListener(
        "click",
        useBudgetInTrip
    );


    updateBudget();
    updateBudgetSummary();
}


/* ---------------------------------
   CURRENCY OPTIONS
--------------------------------- */

function populateCurrencyOptions() {

    const select =
        document.querySelector(
            "#budget-currency"
        );

    if (!select) {
        return;
    }

    const currentValue =
        select.value || "NGN";

    let currencies = [];

    try {

        currencies =
            Intl.supportedValuesOf(
                "currency"
            );

    } catch (error) {

        currencies = [
            "NGN",
            "USD",
            "EUR",
            "GBP",
            "ZAR",
            "CAD",
            "AUD",
            "JPY"
        ];
    }


    const uniqueCurrencies =
        Array.from(
            new Set(currencies)
        );


    const popular =
        POPULAR_CURRENCIES.filter(
            code =>
                uniqueCurrencies.includes(code)
        );


    const remaining =
        uniqueCurrencies
            .filter(
                code =>
                    !popular.includes(code)
            )
            .sort();


    const orderedCurrencies =
        [
            ...popular,
            ...remaining
        ];


    let displayNames;

    try {

        displayNames =
            new Intl.DisplayNames(
                ["en"],
                {
                    type: "currency"
                }
            );

    } catch {

        displayNames = null;
    }


    select.innerHTML =
        orderedCurrencies
            .map(code => {

                let name = code;

                try {

                    name =
                        displayNames?.of(code) ||
                        code;

                } catch {

                    name = code;
                }

                return `
                    <option value="${escapeHTML(code)}">
                        ${escapeHTML(name)} (${escapeHTML(code)})
                    </option>
                `;

            })
            .join("");


    if (
        orderedCurrencies.includes(
            currentValue
        )
    ) {

        select.value =
            currentValue;

    } else {

        select.value =
            "NGN";
    }
}


/* ---------------------------------
   BUDGET DATA
--------------------------------- */

function collectBudgetData() {

    const fields = [
        "accommodation",
        "transportation",
        "food",
        "activities",
        "other"
    ];

    const budget = {};

    fields.forEach(field => {

        const input =
            document.querySelector(
                `[data-budget-field="${field}"]`
            );

        budget[field] =
            normaliseBudgetAmount(
                input?.value
            );
    });


    const currency =
        document.querySelector(
            "#budget-currency"
        );


    budget.currency =
        currency?.value || "NGN";


    budget.total =
        fields.reduce(
            (sum, field) =>
                sum + budget[field],
            0
        );


    return budget;
}


/* ---------------------------------
   BUDGET SUMMARY
--------------------------------- */

function updateBudgetSummary() {

    const summary =
        document.querySelector(
            "#summary-budget"
        );

    if (!summary) {
        return;
    }

    const budget =
        collectBudgetData();


    if (budget.total <= 0) {

        summary.textContent =
            "Not set yet";

        return;
    }


    summary.textContent =
        formatBudgetCurrency(
            budget.total,
            budget.currency
        );
}


/* ---------------------------------
   USE BUDGET IN TRIP
--------------------------------- */

function useBudgetInTrip() {

    const budget =
        collectBudgetData();


    if (budget.total <= 0) {

        showPlannerStatus(
            "Add at least one estimated cost before using your budget."
        );

        return;
    }


    const summary =
        document.querySelector(
            "#summary-budget"
        );


    if (summary) {

        summary.textContent =
            formatBudgetCurrency(
                budget.total,
                budget.currency
            );
    }


    showPlannerStatus(
        "Your trip budget has been added to your trip."
    );
}


/* ---------------------------------
   BUDGET CURRENCY FORMAT
--------------------------------- */

function formatBudgetCurrency(
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


/* ---------------------------------
   BUDGET NUMBER NORMALISATION
--------------------------------- */

function normaliseBudgetAmount(value) {

    const amount =
        Number(value);

    if (
        !Number.isFinite(amount) ||
        amount < 0
    ) {
        return 0;
    }

    return amount;
}

function formatBudgetAmount(amount, currency) {

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

/* =========================
   FORM SUBMISSION
========================= */

function handlePlannerSubmit(event) {

    event.preventDefault();


    const destinationInput =
        document.querySelector(
            "#trip-destination"
        );

    const startInput =
        document.querySelector(
            "#trip-start"
        );

    const endInput =
        document.querySelector(
            "#trip-end"
        );

    const notesInput =
        document.querySelector(
            "#trip-notes"
        );


    const destination =
        destinationInput?.value.trim() || "";

    const startDate =
        startInput?.value || "";

    const endDate =
        endInput?.value || "";

    const notes =
        notesInput?.value.trim() || "";


    if (!destination) {

        showPlannerStatus(
            "Please enter a destination."
        );

        return;
    }


    if (!startDate || !endDate) {

        showPlannerStatus(
            "Please choose your travel dates."
        );

        return;
    }


    if (endDate < startDate) {

        showPlannerStatus(
            "Your end date can't be before your start date."
        );

        return;
    }


    const itinerary =
        collectCurrentItinerary();

    const budget =
        collectBudgetData();
    
    const trip = {
        id:
            new Date().toISOString(),

        destination,

        startDate,

        endDate,

        notes,

        itinerary,

        budget,

        savedAt:
            new Date().toISOString()
    };

    const savedTrip =
        saveTrip(trip);

    displaySavedTrip(savedTrip);

    updateSummary();

    showPlannerStatus(
        "Your itinerary has been saved."
    );
}


/* =========================
   SAVED TRIP
========================= */

function loadSavedTrip() {

    const savedTrip =
        getSavedTrips();
    
    if (!savedTrip.length) {
        return;
    }

    const trip =
        savedTrip[savedTrip.length - 1];
    
    try {
        populateForm(trip);
        displaySavedTrip(trip);
        renderSavedItinerary(trip);
        updateSummaryFromTrip(trip);


    } catch (error) {

        console.error(
            "Could not load saved trip:",
            error
        );
    }
}


function populateForm(trip) {

    const destination =
        document.querySelector(
            "#trip-destination"
        );

    const start =
        document.querySelector(
            "#trip-start"
        );

    const end =
        document.querySelector(
            "#trip-end"
        );

    const notes =
        document.querySelector(
            "#trip-notes"
        );


    if (destination) {
        destination.value =
            trip.destination || "";
    }

    if (start) {
        start.value =
            trip.startDate || "";
    }

    if (end) {
        end.value =
            trip.endDate || "";
    }

    if (notes) {
        notes.value =
            trip.notes || "";
    }
    populateBudget(trip.budget);
}

function populateBudget(budget) {

    const fields = [
        "accommodation",
        "transportation",
        "food",
        "activities",
        "other"
    ];

    fields.forEach(field => {

        const input =
            document.querySelector(
                `[data-budget-field="${field}"]`
            );

        if (input) {
            input.value =
                budget?.[field] ?? "";
        }
    });

    const currency =
        document.querySelector(
            "#budget-currency"
        );

    if (currency) {

        currency.value =
            budget?.currency || "NGN";
    }

    const total =
        document.querySelector(
            "#budget-total"
        );

    if (total) {

        const amount =
            fields.reduce(
                (sum, field) =>
                    sum +
                    normaliseBudgetAmount(
                        budget?.[field]
                    ),
                0
            );

        total.textContent =
            formatBudgetAmount(
                amount,
                currency?.value || "NGN"
            );
    }
}

function renderSavedItinerary(trip) {

    if (
        !trip.startDate ||
        !trip.endDate
    ) {
        return;
    }


    const days =
        createItineraryDays(
            trip.startDate,
            trip.endDate,
            Array.isArray(trip.itinerary)
                ? trip.itinerary
                : []
        );


    renderItinerary(days);
}


function displaySavedTrip(trip) {

    const container =
        document.querySelector(
            "#saved-trip-container"
        );


    if (!container) {
        return;
    }


    const itinerary =
        Array.isArray(trip.itinerary)
            ? trip.itinerary
            : [];


    const plannedItems =
        itinerary.reduce(
            (total, day) =>
                total + day.items.length,
            0
        );


    const itinerarySummary =
        plannedItems === 1
            ? "1 planned item"
            : `${plannedItems} planned items`;


    container.innerHTML = `
        <article class="saved-trip-card">

            <div>

                <p class="eyebrow">
                    ITINERARY SAVED
                </p>

                <h3>
                    ${escapeHTML(trip.destination)}
                </h3>

                <p>
                    ${formatDate(trip.startDate)}
                    –
                    ${formatDate(trip.endDate)}
                </p>

            </div>


            <div class="saved-trip-details">

                <div>

                    <strong>
                        Itinerary
                    </strong>

                    <p>
                        ${itinerarySummary}
                    </p>

                </div>


                ${trip.notes
            ? `
                            <div>

                                <strong>
                                    Trip notes
                                </strong>

                                <p>
                                    ${escapeHTML(trip.notes)}
                                </p>

                            </div>
                        `
            : ""
        }

           </div>


          <div class="saved-trip-actions">

           <a
            class="button button-primary"
            href="./favourites.html?trip=${encodeURIComponent(trip.id)}">
            View Itinerary
           </a>

           <button
            id="clear-trip-button"
            class="button button-secondary"
            type="button">
            Clear Trip
           </button>

          </div>
        </article>
    `;


    const clearButton =
        document.querySelector(
            "#clear-trip-button"
        );

    const viewButton =
        document.querySelector(
            "#view-itinerary-button"
        );


    if (clearButton) {
        clearButton.addEventListener(
            "click",
            clearSavedTrip
        );
    }


    if (viewButton) {
        viewButton.addEventListener(
            "click",
            () => {
                window.location.href =
                    "./favourites.html#saved-itineraries";
            }
        );
    }
}

/* =========================
   CLEAR SAVED TRIP
========================= */

function clearSavedTrip() {

    const savedTrips =
        getSavedTrips();
    
    const currentTrip =
        savedTrips[savedTrips.length - 1];
    
    if (currentTrip?.id) {
        removeSavedTrip(currentTrip.id);
    }

    const form =
        document.querySelector(
            "#trip-form"
        );

    if (form) {
        form.reset();
    }


    renderEmptyItinerary(
        "Select your start and end dates to build your itinerary."
    );


    updateSummary();


    const container =
        document.querySelector(
            "#saved-trip-container"
        );


    if (container) {

        container.innerHTML = `
            <p>
                Your saved trip will appear here.
            </p>
        `;
    }


    showPlannerStatus(
        "Your saved itinerary has been cleared."
    );
}


/* =========================
   SUMMARY
========================= */

function updateSummary() {

    const destination =
        document.querySelector(
            "#summary-destination"
        );

    const dates =
        document.querySelector(
            "#summary-dates"
        );

    const itinerary =
        document.querySelector(
            "#summary-itinerary"
        );


    const destinationInput =
        document.querySelector(
            "#trip-destination"
        );

    const startInput =
        document.querySelector(
            "#trip-start"
        );

    const endInput =
        document.querySelector(
            "#trip-end"
        );


    if (destination && destinationInput) {

        destination.textContent =
            destinationInput.value.trim() ||
            "Not chosen yet";
    }


    if (
        dates &&
        startInput &&
        endInput
    ) {

        dates.textContent =
            startInput.value &&
                endInput.value
                ? `${formatDate(startInput.value)} – ${formatDate(endInput.value)}`
                : "Not chosen yet";
    }


    if (itinerary) {

        const itemCount =
            document.querySelectorAll(
                ".itinerary-item"
            ).length;


        itinerary.textContent =
            itemCount === 0
                ? "No plans added yet"
                : itemCount === 1
                    ? "1 planned item"
                    : `${itemCount} planned items`;
    }
}


function updateSummaryFromTrip(trip) {

    const destination =
        document.querySelector(
            "#summary-destination"
        );

    const dates =
        document.querySelector(
            "#summary-dates"
        );

    const itinerary =
        document.querySelector(
            "#summary-itinerary"
        );

    const budgetSummary =
        document.querySelector(
            "#summary-budget"
        );


    if (budgetSummary) {

        const budget =
            trip.budget;


        if (
            budget &&
            Number(budget.total) > 0
        ) {

            budgetSummary.textContent =
                formatBudgetCurrency(
                    Number(budget.total),
                    budget.currency || "NGN"
                );

        } else {

            budgetSummary.textContent =
                "Not set yet";
        }
    }
        
    if (destination) {

        destination.textContent =
            trip.destination ||
            "Not chosen yet";
    }


    if (dates) {

        dates.textContent =
            trip.startDate &&
                trip.endDate
                ? `${formatDate(trip.startDate)} – ${formatDate(trip.endDate)}`
                : "Not chosen yet";
    }


    if (itinerary) {

        const count =
            Array.isArray(trip.itinerary)
                ? trip.itinerary.reduce(
                    (total, day) =>
                        total + day.items.length,
                    0
                )
                : 0;


        itinerary.textContent =
            count === 0
                ? "No plans added yet"
                : count === 1
                    ? "1 planned item"
                    : `${count} planned items`;
    }
}


/* =========================
   EMPTY ITINERARY
========================= */

function renderEmptyItinerary(message) {

    const container =
        document.querySelector(
            "#itinerary-container"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `
        <p class="itinerary-empty">
            ${escapeHTML(message)}
        </p>
    `;
}

/* =========================
   STATUS
========================= */

function showPlannerStatus(message) {

    const status =
        document.querySelector(
            "#planner-status"
        );


    if (status) {
        status.textContent =
            message;
    }
}
