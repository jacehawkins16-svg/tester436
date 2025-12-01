// --- CONSTANTS ---
// Alternate API (ip-api.com) for GeoLocation
const ALTERNATE_IP_API_URL = 'http://ip-api.com/json'; 

// The endpoint where the data will be POSTed for manual verification/logging.
// This is the "alternate website" for data transfer.
const LOGGING_ENDPOINT = "https://data-store-id-3476854t7ewgbm09us.vercel.app/";

/**
 * Simple function to determine the OS based on the User Agent String.
 */
function getOperatingSystem(userAgent) {
    if (userAgent.includes("Win")) return "Windows";
    if (userAgent.includes("Android")) return "Android";
    if (userAgent.includes("Mac")) return "macOS (Apple)";
    if (userAgent.includes("Linux")) return "Linux";
    if (userAgent.includes("CrOS")) return "Chrome OS";
    if (userAgent.includes("iPhone") || userAgent.includes("iPad")) return "iOS (Apple)";
    return "Unknown/Other";
}

/**
 * Simple function to determine the browser based on the User Agent String.
 */
function getBrowser(userAgent) {
    let browser = "Unknown";
    let version = "";

    if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) {
        browser = "Chrome";
        version = userAgent.match(/Chrome\/(\d+)/)?.[1] || "";
    } else if (userAgent.includes("Firefox")) {
        browser = "Firefox";
        version = userAgent.match(/Firefox\/(\d+)/)?.[1] || "";
    } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
        browser = "Safari";
        version = userAgent.match(/Version\/(\d+)/)?.[1] || "";
    } else if (userAgent.includes("Edg")) {
        browser = "Edge";
        version = userAgent.match(/Edg\/(\d+)/)?.[1] || "";
    } else if (userAgent.includes("MSIE") || userAgent.includes("Trident")) {
        browser = "Internet Explorer";
    }
    return version ? `${browser} (v${version})` : browser;
}

/**
 * Collects all client-side data into an object.
 * @param {string} clientName The user-provided name.
 * @returns {object} The collected client data.
 */
function collectClientData(clientName = "Anonymous") {
    const userAgent = navigator.userAgent;
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    const effectiveType = connection && connection.effectiveType ? connection.effectiveType.toUpperCase() : 'N/A';
    const speed = connection && connection.downlink ? `${connection.downlink.toFixed(1)} Mbps` : 'N/A';
    const isMobile = /Mobi|Android|iPhone|iPad|Windows Phone/i.test(userAgent);
    const now = new Date();

    return {
        name: clientName,
        logTimestamp: now.toISOString(),
        os: getOperatingSystem(userAgent),
        browser: getBrowser(userAgent),
        resolution: `${window.screen.width}x${window.screen.height}`,
        deviceType: isMobile ? 'Mobile/Tablet' : 'Desktop',
        connectionSpeed: `${effectiveType} (${speed})`,
        browserLanguage: navigator.language || 'N/A',
        localTimeFormatted: now.toLocaleTimeString(navigator.language, { 
            weekday: 'short', day: 'numeric', month: 'short', 
            year: 'numeric', hour: '2-digit', minute: '2-digit' 
        }),
        userAgent: userAgent
    };
}

/**
 * Fetches geolocation data from the ALTERNATE API (ip-api.com).
 * @returns {object} The geo-location data, mapped to a consistent format.
 */
async function fetchAlternateGeoData() {
    try {
        const response = await fetch(ALTERNATE_IP_API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error from ip-api.com! Status: ${response.status}`);
        }
        
        const geoData = await response.json();
        
        if (geoData.status && geoData.status === 'success') {
            // Map ip-api.com keys to the desired output format
            return {
                ip: geoData.query,
                org: geoData.isp,       // ISP maps to Organization
                asn: geoData.as,        // AS maps to ASN
                countryCode: geoData.countryCode, 
                region: geoData.regionName, 
                city: geoData.city,
                zip: geoData.zip, 
                coords: `${geoData.lat},${geoData.lon}`, // Combine lat/lon
                timezone: geoData.timezone,
                apiSource: 'ip-api.com' 
            };
        } else {
            // If ip-api.com returns a 'fail' status
            throw new Error(geoData.message || 'Alternate API returned failure status.');
        }

    } catch (error) {
        console.error('Error fetching data from alternate API:', error);
        throw new Error(`Failed to retrieve alternate geolocation data: ${error.message}`);
    }
}

/**
 * Sends the collected data payload to the external logging endpoint (the "alternate website").
 * @param {object} data The complete payload (client data + geo data) to log.
 */
async function sendDataToLog(data) {
    try {
        // Implementing the POST request to the specified endpoint
        const response = await fetch(LOGGING_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            console.log('User data successfully logged to external service.');
        } else {
            console.error(`Failed to log data. Status: ${response.status}.`);
        }
        return response.ok;

    } catch (error) {
        console.error('Error during data logging fetch operation:', error);
        return false;
    }
}

// --- Example Usage Function ---
// This function demonstrates how to run the collection and transfer.
async function runAlternateDataTransfer(clientName) {
    console.log("Starting data collection and transfer using Alternate API structure...");
    try {
        // 1. Collect client-side data
        const clientData = collectClientData(clientName);
        
        // 2. Fetch geolocation data from the alternate API
        const geoData = await fetchAlternateGeoData();
        
        // 3. Combine and create the final payload
        const fullPayload = {
            ...clientData,
            ...geoData
        };

        // 4. Send the combined data to the logging endpoint
        const success = await sendDataToLog(fullPayload);

        if (success) {
            console.log("Full payload successfully transferred to logging server.");
        } else {
            console.log("Data transfer failed.");
        }
        return fullPayload;

    } catch (error) {
        console.error(`Data transfer process failed: ${error.message}`);
        // You would typically handle UI error display here.
        return null;
    }
}

// Note: To use this in an HTML file, you would call `runAlternateDataTransfer('Your Name')`
// after the page loads.
