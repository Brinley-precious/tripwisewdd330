import {
    updateCurrentYear,
    setupMobileMenu
} from "./utils.js";


document.addEventListener(
    "DOMContentLoaded",
    () => {

        updateCurrentYear();

        setupMobileMenu();

        setupAboutAnimations();

        setupAboutActions();

    }
);


/* =====================================================
   ABOUT PAGE SCROLL REVEALS
===================================================== */

function setupAboutAnimations() {

    const elements =
        document.querySelectorAll(
            ".about-story, .about-principle, .about-experience, .about-founder"
        );


    if (!elements.length) {
        return;
    }


    if (!("IntersectionObserver" in window)) {

        elements.forEach(
            element => {
                element.classList.add("is-visible");
            }
        );

        return;
    }


    const observer =
        new IntersectionObserver(
            (entries, observerInstance) => {

                entries.forEach(
                    entry => {

                        if (entry.isIntersecting) {

                            entry.target.classList.add(
                                "is-visible"
                            );

                            observerInstance.unobserve(
                                entry.target
                            );

                        }

                    }
                );

            },
            {
                threshold: 0.12
            }
        );


    elements.forEach(
        element => {
            observer.observe(element);
        }
    );

}


/* =====================================================
   ABOUT CTA ACTIONS
===================================================== */

function setupAboutActions() {

    const exploreButtons =
        document.querySelectorAll(
            'a[href="./destinations.html"]'
        );


    if (!exploreButtons.length) {
        return;
    }


    exploreButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    /*
                     * These are normal HTML links.
                     * No JavaScript navigation is required.
                     *
                     * The destination page must exist as:
                     *
                     * ./destinations.html
                     */

                }
            );

        }
    );

}