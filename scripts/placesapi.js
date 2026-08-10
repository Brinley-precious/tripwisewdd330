const GEOAPIFY_API_KEY = "82a39fd4e1684147bbcf4b653b47faed";

const GEOCODE_URL =
    "https://api.geoapify.com/v1/geocode/search";

const PLACES_URL =
    "https://api.geoapify.com/v2/places";

const DETAILS_URL =
    "https://api.geoapify.com/v2/place-details";

const WIKIPEDIA_URL =
    "https://en.wikipedia.org/w/api.php";

const DEFAULT_LIMIT = 6;


/**
 * Fetch tourist attractions and places for a destination.
 *
 * @param {string} destination - Country or city name.
 * @param {number} limit - Maximum number of places to return.
 * @returns {Promise<object>} Location and places data.
 */
export async function fetchPlaces(
    destination,
    limit = DEFAULT_LIMIT
) {
    if (!destination || !destination.trim()) {
        throw new Error(
            "A destination is required."
        );
    }

    const safeLimit =
        Math.min(
            Math.max(Number(limit) || DEFAULT_LIMIT, 1),
            DEFAULT_LIMIT
        );

    const location =
        await geocodeDestination(
            destination.trim()
        );

    const places =
        await fetchPlacesForLocation(
            location,
            safeLimit
        );

    const enrichedPlaces =
        await Promise.all(
            places.map(enrichPlace)
        );

    return {
        location,
        places: enrichedPlaces.slice(
            0,
            safeLimit
        )
    };
}


/* ---------------------------------
   GEOCODING
--------------------------------- */

async function geocodeDestination(
    destination
) {
    let location =
        await geocode(
            destination,
            "country"
        );

    if (!location) {
        location =
            await geocode(
                destination,
                "city"
            );
    }

    if (!location) {
        throw new Error(
            `Could not locate ${destination}.`
        );
    }

    return location;
}


async function geocode(
    destination,
    type
) {
    const url =
        new URL(GEOCODE_URL);

    url.searchParams.set(
        "text",
        destination
    );

    url.searchParams.set(
        "type",
        type
    );

    url.searchParams.set(
        "limit",
        "1"
    );

    url.searchParams.set(
        "lang",
        "en"
    );

    url.searchParams.set(
        "apiKey",
        GEOAPIFY_API_KEY
    );

    const response =
        await fetch(url);

    if (!response.ok) {
        return null;
    }

    const data =
        await response.json();

    const feature =
        data.features?.[0];

    if (!feature) {
        return null;
    }

    const properties =
        feature.properties || {};

    return {
        name:
            properties.name ||
            destination,

        city:
            properties.city ||
            properties.name ||
            destination,

        country:
            properties.country ||
            "",

        countryCode:
            properties.country_code ||
            "",

        latitude:
            properties.lat,

        longitude:
            properties.lon,

        placeId:
            properties.place_id ||
            "",

        type
    };
}


/* ---------------------------------
   PLACES
--------------------------------- */

async function fetchPlacesForLocation(
    location,
    limit
) {
    const categories = [
        "tourism",
        "tourism.attraction",
        "tourism.sights",
        "tourism.sights.place_of_worship",
        "tourism.sights.castle",
        "entertainment.museum",
        "entertainment.culture",
        "entertainment.aquarium",
        "entertainment.zoo",
        "entertainment.theme_park",
        "leisure.park",
        "leisure.park.garden",
        "beach"
    ].join(",");

    const candidates = [];

    if (location.placeId) {
        const results =
            await requestPlaces(
                categories,
                `place:${location.placeId}`,
                location
            );

        candidates.push(...results);
    }

    if (
        uniquePlaces(candidates).length <
        limit
    ) {
        const fallbackRadii = [
            25000,
            75000,
            150000
        ];

        for (const radius of fallbackRadii) {
            const results =
                await requestPlaces(
                    categories,
                    `circle:${location.longitude},${location.latitude},${radius}`,
                    location
                );

            candidates.push(...results);

            if (
                uniquePlaces(candidates).length >=
                limit
            ) {
                break;
            }
        }
    }

    return uniquePlaces(candidates)
        .slice(0, limit);
}


async function requestPlaces(
    categories,
    filter,
    location
) {
    const url =
        new URL(PLACES_URL);

    url.searchParams.set(
        "categories",
        categories
    );

    url.searchParams.set(
        "filter",
        filter
    );

    url.searchParams.set(
        "bias",
        `proximity:${location.longitude},${location.latitude}`
    );

    url.searchParams.set(
        "limit",
        "30"
    );

    url.searchParams.set(
        "lang",
        "en"
    );

    url.searchParams.set(
        "apiKey",
        GEOAPIFY_API_KEY
    );

    const response =
        await fetch(url);

    if (!response.ok) {
        const errorText = await response.text();

        console.warn(
            "Geoapify places request failed:",
            response.status,
            errorText
        );

        return [];
    }

    const data =
        await response.json();

    return (data.features || [])
        .map(feature => {
            const properties =
                feature.properties || {};

            const name =
                String(
                    properties.name || ""
                ).trim();

            if (!name) {
                return null;
            }

            return {
                id:
                    properties.place_id ||
                    null,

                name,

                category:
                    getCategory(
                        properties.categories
                    ),

                address:
                    properties.formatted ||
                    properties.address_line1 ||
                    properties.city ||
                    "",

                city:
                    properties.city ||
                    location.city,

                country:
                    properties.country ||
                    location.country,

                latitude:
                    properties.lat,

                longitude:
                    properties.lon,

                distance:
                    properties.distance ||
                    null,

                categories:
                    Array.isArray(
                        properties.categories
                    )
                        ? properties.categories
                        : [],

                description: "",
                website: "",
                wikipedia: "",
                openingHours: "",
                map: ""
            };
        })
        .filter(Boolean);
}


function uniquePlaces(places) {
    const seen =
        new Set();

    return places.filter(place => {
        const key =
            place.id ||
            `${place.name}-${place.latitude}-${place.longitude}`;

        if (seen.has(key)) {
            return false;
        }

        seen.add(key);

        return true;
    });
}


/* ---------------------------------
   PLACE ENRICHMENT
--------------------------------- */

async function enrichPlace(place) {
    let result = {
        ...place
    };

    /*
     * Try to get additional information from Geoapify.
     * Coordinates are used instead of place.id because
     * they are more reliable for the Place Details request.
     */
    const latitude = Number(place.latitude);
    const longitude = Number(place.longitude);

    if (
        !Number.isNaN(latitude) &&
        !Number.isNaN(longitude)
    ) {
        try {
            const details =
                await fetchPlaceDetails(
                    latitude,
                    longitude
                );

            result = {
                ...result,
                ...details
            };

        } catch (error) {

            console.warn(
                `Details failed for ${place.name}:`,
                error.message
            );
        }
    }

    /*
     * Use Wikipedia for an English name,
     * description, and Wikipedia link.
     */
    try {

        const wikipedia =
            await fetchWikipediaData(
                result.name,
                result.city,
                result.country
            );

        if (wikipedia) {

            result.name =
                wikipedia.title ||
                result.name;

            result.description =
                wikipedia.description ||
                result.description ||
                "";

            result.wikipedia =
                wikipedia.url ||
                result.wikipedia ||
                "";
        }

    } catch (error) {

        console.warn(
            `Wikipedia failed for ${place.name}:`,
            error.message
        );
    }


    /*
     * Create a Google Maps link
     * when coordinates are available.
     */
    if (
        typeof result.latitude === "number" &&
        typeof result.longitude === "number"
    ) {

        result.map =
            `https://www.google.com/maps/search/?api=1&query=${result.latitude},${result.longitude}`;
    }

    return result;
}


/* ---------------------------------
   PLACE DETAILS
--------------------------------- */

async function fetchPlaceDetails(
    latitude,
    longitude
) {
    if (
        typeof latitude !== "number" ||
        typeof longitude !== "number"
    ) {
        return {};
    }

    const url =
        new URL(DETAILS_URL);

    url.searchParams.set(
        "lat",
        String(latitude)
    );

    url.searchParams.set(
        "lon",
        String(longitude)
    );

    url.searchParams.set(
        "features",
        "details"
    );

    url.searchParams.set(
        "lang",
        "en"
    );

    url.searchParams.set(
        "apiKey",
        GEOAPIFY_API_KEY
    );

    const response =
        await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Place details request failed: ${response.status}`
        );
    }

    const data =
        await response.json();

    const details =
        data.features?.find(
            feature =>
                feature.properties?.feature_type ===
                "details"
        )?.properties || {};

    const raw =
        details.datasource?.raw || {};

    const englishName =
        details.name_en ||
        details["name:en"] ||
        details.name_int ||
        details["name:international"] ||
        raw.name_en ||
        raw["name:en"] ||
        raw.name_int ||
        raw["name:international"] ||
        details.name ||
        raw.name ||
        "";

    const website =
        details.website ||
        details.website_international?.en ||
        raw.website ||
        raw.url ||
        raw.homepage ||
        "";

    return {
        name: englishName,

        description:
            details.description ||
            raw.description ||
            "",

        website,

        openingHours:
            details.opening_hours ||
            "",

        wikipedia:
            details.wiki_and_media?.wikipedia ||
            "",

        image:
            details.wiki_and_media?.image ||
            ""
    };
}

/* ---------------------------------
   WIKIPEDIA
--------------------------------- */

async function fetchWikipediaData(
    placeName,
    city,
    country
) {
    const searches = [
        `${placeName} ${city} ${country}`,
        `${placeName} ${city}`,
        placeName
    ];

    for (const searchTerm of searches) {
        const result =
            await searchWikipedia(
                searchTerm
            );

        if (result) {
            return result;
        }
    }

    return null;
}


async function searchWikipedia(
    searchTerm
) {
    const url =
        new URL(WIKIPEDIA_URL);

    url.searchParams.set(
        "action",
        "query"
    );

    url.searchParams.set(
        "generator",
        "search"
    );

    url.searchParams.set(
        "gsrsearch",
        searchTerm
    );

    url.searchParams.set(
        "gsrnamespace",
        "0"
    );

    url.searchParams.set(
        "gsrlimit",
        "1"
    );

    url.searchParams.set(
        "prop",
        "extracts|info"
    );

    url.searchParams.set(
        "inprop",
        "url"
    );

    url.searchParams.set(
        "exintro",
        "1"
    );

    url.searchParams.set(
        "explaintext",
        "1"
    );

    url.searchParams.set(
        "exchars",
        "400"
    );

    url.searchParams.set(
        "format",
        "json"
    );

    url.searchParams.set(
        "origin",
        "*"
    );

    const response =
        await fetch(url);

    if (!response.ok) {
        return null;
    }

    const data =
        await response.json();

    const pages =
        data.query?.pages;

    if (!pages) {
        return null;
    }

    const page =
        Object.values(pages)[0];

    if (!page || page.missing) {
        return null;
    }

    return {
        title:
            page.title ||
            "",

        description:
            page.extract ||
            "",

        url:
            page.fullurl ||
            ""
    };
}


/* ---------------------------------
   CATEGORY
--------------------------------- */

function getCategory(
    categories = []
) {
    const values =
        Array.isArray(categories)
            ? categories.map(
                category =>
                    String(category).toLowerCase()
            )
            : [];

    const categoryMap = [
        ["museum", "MUSEUM"],
        ["church", "CHURCH"],
        ["mosque", "MOSQUE"],
        ["temple", "TEMPLE"],
        ["shrine", "SHRINE"],
        ["synagogue", "SYNAGOGUE"],
        ["zoo", "ZOO"],
        ["aquarium", "AQUARIUM"],
        ["gallery", "GALLERY"],
        ["theatre", "THEATRE"],
        ["park", "PARK"],
        ["garden", "GARDEN"],
        ["castle", "CASTLE"],
        ["monument", "MONUMENT"],
        ["memorial", "MEMORIAL"],
        ["viewpoint", "VIEWPOINT"],
        ["beach", "BEACH"]
    ];

    for (const [keyword, label] of categoryMap) {
        if (
            values.some(
                category =>
                    category.includes(keyword)
            )
        ) {
            return label;
        }
    }

    if (
        values.some(
            category =>
                category.includes("attraction") ||
                category.includes("sight")
        )
    ) {
        return "ATTRACTION";
    }

    return "PLACE TO EXPLORE";
}