# Sentinel - Global Seismic Monitor

## Overview

Sentinel is a real-time geographical dashboard designed to track, visualize, and analyze global seismic events. Built with React and TypeScript, the application interfaces directly with the United States Geological Survey (USGS) Earthquake Hazards Program, NOAA, and orbital tracking APIs to provide a live feed of planetary vitals.

Beyond simple visualization, Sentinel integrates artificial intelligence via the Google Gemini API to provide situational analysis, generating news summaries and identifying critical infrastructure near earthquake epicenters. The application features a cinematic interface with distinct operating modes for real-time monitoring, historical education, and theoretical simulation.

## Key Features

### Planetary Telemetry
*   **Seismic Network**: Real-time data feed from the USGS (All Earthquakes, Past Day).
*   **Magma Monitor**: Tracking of significant active volcanoes and eruption status globally.
*   **Cosmic Weather**: Live geomagnetic activity monitoring (K-index) via NOAA SWPC, vital for detecting solar storms.
*   **Orbital Assets**: Real-time tracking of the International Space Station (ISS) trajectory and visibility.

### Intelligent Visualization
*   **Data Encoding**: Seismic events are rendered as circular markers where radius correlates to magnitude and color correlates to depth, providing immediate visual assessment.
*   **Vector Overlays**: Interactive tectonic plate boundaries and ISS flight path visualization.
*   **Cinematic Patrol**: An automated "screensaver" mode that detects user inactivity and performs smooth, cinematic flyovers of major seismic events without user intervention.

### AI-Powered Analysis
*   **Situation Reports**: Uses Google Gemini to generate context-aware summaries of seismic events, identifying tectonic settings and aggregating recent news.
*   **Infrastructure Reconnaissance**: Leverages Google Maps grounding to identify emergency infrastructure (hospitals, fire stations) within the vicinity of a selected epicenter.

## Operational Modes

1.  **Live Feed**: The standard operating mode displaying current seismic data with filtering, sorting (Time/Distance), and list views.
2.  **Magma Monitor**: A dedicated view for tracking active volcanic unrest and eruptions.
3.  **Cosmic Weather**: A digital dashboard for solar wind and magnetosphere status.
4.  **Museum (Archive)**: A curated timeline of historically significant earthquakes (e.g., Valdivia 1960, Tohoku 2011) with detailed impact metrics.
5.  **Simulation Lab**: An interactive environment allowing users to:
    *   **Impact**: Simulate energy release and felt radius based on magnitude and depth.
    *   **Wave**: Visualize P-wave and S-wave propagation delays.
    *   **Forecast**: Review statistical aftershock probabilities based on recent data.
6.  **Protocols**: Official safety directives based on United Nations (UNDRR) frameworks, categorized by Mitigation, Response, and Recovery phases.

## Technology Stack

*   **Frontend Framework**: React 19 (Functional Components, Hooks)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS (Utility-first architecture, Custom Animations)
*   **Mapping Engine**: Leaflet / React-Leaflet with OpenStreetMap and CARTO tiles
*   **Artificial Intelligence**: Google GenAI SDK (Gemini 2.5/3.0 models)
*   **External APIs**:
    *   USGS Earthquake Hazards Program
    *   NOAA Space Weather Prediction Center
    *   WhereTheISS.at API
    *   Google Gemini & Google Maps Grounding

## Installation and Setup

### Prerequisites
*   Node.js (v18.0.0 or higher)
*   npm or yarn package manager

### Build Instructions

1.  Clone the repository to your local machine.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
4.  Build for production:
    ```bash
    npm run build
    ```

## Disclaimer

This application is for educational and informational purposes only. While it utilizes official USGS and NOAA data, it should not be relied upon as a primary warning system for life-critical decisions. Data latency may occur. Always follow official instructions from local emergency management authorities during seismic events.