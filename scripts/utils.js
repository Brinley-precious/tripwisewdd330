/* =========================
   SHARED UTILITIES
========================= */

export function updateCurrentYear() {
    const yearElement =
        document.querySelector("#current-year");

    if (yearElement) {
        yearElement.textContent =
            new Date().getFullYear();
    }
}

export function setupMobileMenu() {
    const menuButton =
        document.querySelector(".menu-button");

    const navigation =
        document.querySelector("#site-navigation");

    if (!menuButton || !navigation) {
        return;
    }

    menuButton.addEventListener("click", () => {
        const isOpen =
            navigation.classList.toggle("open");

        menuButton.setAttribute(
            "aria-expanded",
            String(isOpen)
        );
    });
}

export function formatDate(dateString) {
    if (!dateString) {
        return "Date unavailable";
    }

    const date =
        new Date(`${dateString}T00:00:00`);

    return new Intl.DateTimeFormat(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    ).format(date);
}


export function formatDateForStorage(date) {
    return date
        .toISOString()
        .split("T")[0];
}

export function formatTime(timeString) {
    if (!timeString) {
        return "Time not set";
    }

    const [hours, minutes] =
        timeString
            .split(":")
            .map(Number);

    if (
        Number.isNaN(hours) ||
        Number.isNaN(minutes)
    ) {
        return timeString;
    }

    const date = new Date();

    date.setHours(
        hours,
        minutes,
        0,
        0
    );

    return new Intl.DateTimeFormat(
        "en-US",
        {
            hour: "numeric",
            minute: "2-digit"
        }
    ).format(date);
}

export function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
