# Security Policy

## Supported Versions

The following versions of the Sentinel project are currently supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 2.x     | :white_check_mark: |
| 1.x     | :x:                |

## Reporting a Vulnerability

We take the security of this software seriously. If you discover a vulnerability, please follow the guidelines below to report it responsibly.

### Reporting Process

1.  Do not open a public GitHub issue for security vulnerabilities.
2.  Email the project maintainers directly at [insert-email-here].
3.  Include a detailed description of the vulnerability, steps to reproduce it, and any potential impact.
4.  You should expect a response within 48 hours acknowledging receipt of your report.

We will work to verify the issue and develop a patch. We ask that you refrain from publicly disclosing the vulnerability until a fix has been released.

## API Key Management

This application utilizes the Google GenAI SDK which requires an API Key.

*   **Client-Side Exposure**: As a single-page React application, environment variables embedded during the build process may be visible in the browser source code. For production deployments, it is strictly recommended to proxy API requests through a secure backend server to prevent API key leakage.
*   **Repository Security**: Ensure that the `.env` file containing your `API_KEY` is included in your `.gitignore` file and is never committed to a public repository.

## Data Privacy

*   **Geolocation**: This application requests access to the user's browser geolocation API to calculate proximity to seismic events. This data is processed locally within the client's browser and is not transmitted to any external server or stored permanently.
*   **External APIs**: The application makes requests to the USGS (United States Geological Survey) for public data. No user-identifiable information is sent to the USGS.

## Disclaimer

This software is provided "as is", without warranty of any kind, express or implied. The authors are not responsible for any damages or liabilities arising from the use of this software.