// Google Analytics Event Tracking Helper Functions

declare global {
    interface Window {
        gtag?: (
            command: 'event' | 'config' | 'js',
            targetId: string,
            config?: Record<string, any>
        ) => void;
    }
}

/**
 * Track a generic event in Google Analytics
 * @param eventName - Name of the event (e.g., 'button_click')
 * @param eventParams - Additional parameters for the event
 */
export const trackEvent = (
    eventName: string,
    eventParams?: Record<string, any>
) => {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', eventName, eventParams);
    }
};

/**
 * Track a button click event
 * @param buttonName - Identifier for the button (e.g., 'buat_undangan')
 * @param pageLocation - Where the button is located (e.g., 'landing_page')
 * @param buttonText - Optional text displayed on the button
 */
export const trackButtonClick = (
    buttonName: string,
    pageLocation: string,
    buttonText?: string
) => {
    trackEvent('button_click', {
        button_name: buttonName,
        page_location: pageLocation,
        button_text: buttonText,
    });
};

/**
 * Track a link click event
 * @param linkName - Identifier for the link
 * @param linkUrl - URL the link points to
 * @param pageLocation - Where the link is located
 */
export const trackLinkClick = (
    linkName: string,
    linkUrl: string,
    pageLocation: string
) => {
    trackEvent('link_click', {
        link_name: linkName,
        link_url: linkUrl,
        page_location: pageLocation,
    });
};
