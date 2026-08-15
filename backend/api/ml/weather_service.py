"""
Weather Service Module
Fetches real-time weather data from the Open-Meteo API.
"""

import numpy as np

try:
    import openmeteo_requests
    import requests_cache
    from retry_requests import retry
    WEATHER_AVAILABLE = True
except ImportError:
    WEATHER_AVAILABLE = False


class WeatherService:
    """Fetches weather data from Open-Meteo API."""

    def __init__(self):
        if WEATHER_AVAILABLE:
            try:
                cache_session = requests_cache.CachedSession(
                    '.cache',
                    expire_after=3600
                )
                retry_session = retry(
                    cache_session,
                    retries=5,
                    backoff_factor=0.2
                )
                self.client = openmeteo_requests.Client(session=retry_session)
            except Exception:
                self.client = None
        else:
            self.client = None

    def fetch_weather(self, latitude=18.30, longitude=83.90):
        """
        Fetch current weather data for given coordinates.

        Parameters:
        -----------
        latitude : float — Latitude (default: Srikakulam)
        longitude : float — Longitude

        Returns:
        --------
        dict with temperature, humidity, rainfall averages
        """
        if self.client is None:
            return self._get_fallback_data(latitude, longitude)

        try:
            url = "https://api.open-meteo.com/v1/forecast"
            params = {
                "latitude": latitude,
                "longitude": longitude,
                "hourly": [
                    "temperature_2m",
                    "relative_humidity_2m",
                    "precipitation"
                ],
                "forecast_days": 1
            }

            responses = self.client.weather_api(url, params=params)
            response = responses[0]

            hourly = response.Hourly()
            temperature = hourly.Variables(0).ValuesAsNumpy()
            humidity = hourly.Variables(1).ValuesAsNumpy()
            rainfall = hourly.Variables(2).ValuesAsNumpy()

            return {
                'temperature': round(float(np.mean(temperature)), 2),
                'humidity': round(float(np.mean(humidity)), 2),
                'rainfall': round(float(np.sum(rainfall)), 2),
                'temperature_hourly': [round(float(t), 2) for t in temperature],
                'humidity_hourly': [round(float(h), 2) for h in humidity],
                'rainfall_hourly': [round(float(r), 2) for r in rainfall],
                'latitude': response.Latitude(),
                'longitude': response.Longitude(),
                'elevation': response.Elevation(),
                'source': 'open-meteo',
                'status': 'success',
            }

        except Exception as e:
            print(f"[WeatherService] API error: {e}")
            return self._get_fallback_data(latitude, longitude)

    def _get_fallback_data(self, latitude, longitude):
        """Return fallback data when API is unavailable."""
        return {
            'temperature': 25.0,
            'humidity': 65.0,
            'rainfall': 150.0,
            'temperature_hourly': [],
            'humidity_hourly': [],
            'rainfall_hourly': [],
            'latitude': latitude,
            'longitude': longitude,
            'elevation': None,
            'source': 'fallback',
            'status': 'api_unavailable',
        }
