const FAVOURITES_STORAGE_KEY = "tripwiseFavourites";
const SAVED_TRIPS_STORAGE_KEY = "tripwiseSavedTrips";


/* =========================================
   FAVOURITE DESTINATIONS
========================================= */

function getFavourites() {

    try {

        const saved =
            localStorage.getItem(
                FAVOURITES_STORAGE_KEY
            );

        if (!saved) {
            return [];
        }

        const favourites =
            JSON.parse(saved);

        return Array.isArray(favourites)
            ? favourites
            : [];

    } catch (error) {

        console.error(
            "Could not read favourites:",
            error
        );

        return [];
    }
}


function saveFavourites(favourites) {

    localStorage.setItem(
        FAVOURITES_STORAGE_KEY,
        JSON.stringify(favourites)
    );
}


function isFavourite(countryName) {

    const favourites =
        getFavourites();

    return favourites.some(
        favourite =>
            favourite.name.toLowerCase() ===
            countryName.toLowerCase()
    );
}


function addFavourite(country) {

    const favourites =
        getFavourites();

    const alreadySaved =
        favourites.some(
            favourite =>
                favourite.name.toLowerCase() ===
                country.name.toLowerCase()
        );

    if (alreadySaved) {
        return;
    }

    favourites.push(country);

    saveFavourites(favourites);
}


function removeFavourite(countryName) {

    const favourites =
        getFavourites();

    const updatedFavourites =
        favourites.filter(
            favourite =>
                favourite.name.toLowerCase() !==
                countryName.toLowerCase()
        );

    saveFavourites(updatedFavourites);
}


/* =========================================
   SAVED ITINERARIES
========================================= */

function getSavedTrips() {

    try {

        const saved =
            localStorage.getItem(
                SAVED_TRIPS_STORAGE_KEY
            );

        if (!saved) {
            return [];
        }

        const trips =
            JSON.parse(saved);

        return Array.isArray(trips)
            ? trips
            : [];

    } catch (error) {

        console.error(
            "Could not read saved trips:",
            error
        );

        return [];
    }
}


function saveTrip(trip) {

    const trips =
        getSavedTrips();

    const tripId =
        trip.id ||
        trip.savedAt ||
        Date.now().toString();

    const savedTrip = {
        ...trip,
        id: tripId
    };

    const existingIndex =
        trips.findIndex(
            saved =>
                saved.id === tripId
        );

    if (existingIndex >= 0) {

        trips[existingIndex] =
            savedTrip;

    } else {

        trips.unshift(savedTrip);
    }

    localStorage.setItem(
        SAVED_TRIPS_STORAGE_KEY,
        JSON.stringify(trips)
    );

    return savedTrip;
}


function removeSavedTrip(tripId) {

    const trips =
        getSavedTrips();

    const updatedTrips =
        trips.filter(
            trip =>
                trip.id !== tripId
        );

    localStorage.setItem(
        SAVED_TRIPS_STORAGE_KEY,
        JSON.stringify(updatedTrips)
    );
}


function getSavedTrip(tripId) {

    const trips =
        getSavedTrips();

    return trips.find(
        trip =>
            trip.id === tripId
    ) || null;
}


export {
    getFavourites,
    addFavourite,
    removeFavourite,
    isFavourite,
    getSavedTrips,
    saveTrip,
    removeSavedTrip,
    getSavedTrip
};