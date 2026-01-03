# Sentinel - Global Seismic Monitor

## Overview

Sentinel is a real-time geographical dashboard designed to track, visualize, and analyze global seismic events. Built with React and TypeScript, the application interfaces directly with the United States Geological Survey (USGS) Earthquake Hazards Program to provide a live feed of seismic activity.

Beyond simple visualization, Sentinel integrates artificial intelligence via the Google Gemini API to provide situational analysis, generating news summaries and identifying critical infrastructure near earthquake epicenters. The application features a cinematic interface with distinct operating modes for real-time monitoring, historical education, and theoretical simulation.

## Key Features

### Live Monitoring
*   **Real-time Data Feed**: Fetches data from the USGS GeoJSON summary feed (All Earthquakes, Past Day).
*   **Visual Data Encoding**: Seismic events are rendered as circular markers where radius correlates to magnitude and color correlates to depth, providing immediate visual assessment of event severity.
*   **Geospatial Visualization**: Utilizes Leaflet for interactive global mapping, including tectonic plate boundary overlays.
*   **Idle Patrol Mode**: An automated system that cycles through significant seismic events when the application detects user inactivity, functioning as a data visualization screensaver.

### AI-Powered Analysis
*   **Situation Reports**: Uses Google Gemini to generate context-aware summaries of seismic events, identifying tectonic settings and aggregating recent news.
*   **Infrastructure Reconnaissance**: Leverages Google Maps grounding to identify emergency infrastructure (hospitals, fire stations) within the vicinity of a selected epicenter.

### Operational Modes
1.  **Live Feed**: The standard operating mode displaying current data with search and sorting capabilities.
2.  **Museum (Archive)**: A curated timeline of historically significant earthquakes (e.g., Valdivia 1960, Tohoku 2011) with detailed impact metrics.
3.  **Simulation Lab**: An interactive environment allowing users to simulate impact radii based on magnitude and depth, as well as visualize P-wave and S-wave propagation speeds.
4.  **Protocols**: A preparedness checklist and emergency action guide based on civil defense standards.

## Technology Stack

*   **Frontend Framework**: React 19 (Functional Components, Hooks)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS (Utility-first architecture)
*   **Mapping Engine**: Leaflet / React-Leaflet with OpenStreetMap and CARTO tiles
*   **Artificial Intelligence**: Google GenAI SDK (Gemini 2.5/3.0 models)
*   **Icons**: Lucide React
*   **Data Source**: USGS Earthquake Hazards Program

## Installation and Setup

### Prerequisites
*   Node.js (v18.0.0 or higher)
*   npm or yarn package manager

### Configuration
The application requires a valid API key from Google AI Studio to enable the generative AI features (Analysis Modal).

1.  Create a file named `.env` in the project root.
2.  Add the following environment variable:
    ```
    API_KEY=your_google_ai_studio_key_here
    ```

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

## Project Structure

*   `src/components`: Reusable UI components (Map, Sidebar, Modals).
*   `src/services`: API integration services (USGS fetchers, Gemini AI client).
*   `src/data`: Static data files (Historical legends, configuration constants).
*   `src/types`: TypeScript interface definitions for GeoJSON and internal state.

## Disclaimer

This application is for educational and informational purposes only. While it utilizes official USGS data, it should not be relied upon as a primary warning system for life-critical decisions. Data latency may occur. Always follow official instructions from local emergency management authorities during seismic events.