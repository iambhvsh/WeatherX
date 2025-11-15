/**
 * Weather App - Main Application
 * A modern weather application with AI-powered insights using Google Gemini API
 * Features: Real-time weather data, 7-day forecast, AI chat assistant, theme customization
 */

document.addEventListener('DOMContentLoaded', () => {
  /**
   * @type {Object|null} Current weather data from API
   */
  let currentWeatherData = null;
  
  /**
   * @type {Array<{role: string, content: string}>} AI conversation history
   */
  let conversationHistory = [];
  
  /**
   * @type {HTMLElement|null} Reference to thinking indicator message
   */
  let thinkingMessage = null;

  // Theme elements
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  const topAppBar = document.getElementById('top-app-bar');
  const mainScrollContainer = document.getElementById('main-scroll-container');
  
  // Settings modal elements
  const settingsModal = document.getElementById('settings-modal');
  const settingsToggle = document.getElementById('settings-toggle');
  const settingsOverlay = document.getElementById('settings-overlay');
  const settingsContent = document.getElementById('settings-content-wrapper');
  const settingsCloseBtn = document.getElementById('settings-close-btn');
  const settingsApiKeyInput = document.getElementById('settings-gemini-api-key');
  const saveApiKeyBtn = document.getElementById('save-api-key-btn');
  
  // AI modal elements
  const aiModal = document.getElementById('ai-modal');
  const aiFab = document.getElementById('ai-fab');
  const aiModalOverlay = document.getElementById('ai-modal-overlay');
  const aiModalContent = document.getElementById('ai-modal-content-wrapper');
  const aiModalCloseBtn = document.getElementById('ai-modal-close-btn');
  const aiSendBtn = document.getElementById('ai-send-btn');
  const aiInput = document.getElementById('ai-input');
  const aiClearBtn = document.getElementById('ai-clear-btn');
  const aiWelcomeMessage = document.getElementById('ai-welcome-message');
  const conversationScrollArea = document.getElementById('conversation-scroll-area');
  
  // Search elements
  const searchView = document.getElementById('search-view');
  const searchIconBtn = document.getElementById('search-icon-btn');
  const searchBackBtn = document.getElementById('search-back-btn');
  const searchInput = document.getElementById('search-input');
  const searchResultsContainer = document.getElementById('search-results');
  
  // Weather display elements
  const weatherContentEl = document.getElementById('weather-content');
  const locationEl = document.getElementById('location');
  const currentTempEl = document.getElementById('current-temp');
  const feelsLikeEl = document.getElementById('feels-like');
  const currentConditionEl = document.getElementById('current-condition');
  const currentIconEl = document.getElementById('current-icon');
  const hourlyContainer = document.getElementById('hourly-forecast-container');
  const dailyContainer = document.getElementById('daily-forecast-container');
  const bentoGrid = document.getElementById('bento-grid');
  const loadingEl = document.getElementById('loading');
  const errorEl = document.getElementById('error-message');
  
  /**
   * Weather icon mapping from weather codes to Material Symbols
   * @type {Object<number, string>}
   */
  const weatherIcons = {
    0: 'clear_day', 1: 'clear_day', 2: 'partly_cloudy_day', 3: 'cloud',
    45: 'foggy', 48: 'foggy', 51: 'rainy_light', 53: 'rainy', 55: 'rainy_heavy',
    61: 'rainy_light', 63: 'rainy', 65: 'rainy_heavy', 71: 'weather_snowy',
    73: 'weather_snowy', 75: 'weather_snowy', 80: 'rainy', 81: 'rainy_heavy',
    82: 'thunderstorm', 85: 'weather_snowy', 86: 'weather_snowy',
    95: 'thunderstorm', 96: 'thunderstorm', 99: 'thunderstorm'
  };

  /**
   * Debounces a function call to limit execution frequency
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Gets the current location name from the DOM
   * @returns {string} Location name or default text
   */
  function getLocationName() {
    return document.getElementById('location').textContent || 'your location';
  }

  /**
   * Creates a structured weather object from API data
   * @param {Object} weatherData - Raw weather data from API
   * @returns {Object} Formatted weather object with all current conditions
   */
  function createCurrentWeatherObject(weatherData) {
    const locationName = getLocationName();
    return {
      location: locationName,
      temperature: Math.round(weatherData.current.temperature_2m),
      feelsLike: Math.round(weatherData.current.apparent_temperature),
      condition: getWeatherDescription(weatherData.current.weather_code),
      humidity: weatherData.current.relative_humidity_2m,
      windSpeed: Math.round(weatherData.current.wind_speed_10m),
      windDirection: getWindDirection(weatherData.current.wind_direction_10m),
      pressure: Math.round(weatherData.current.pressure_msl),
      visibility: weatherData.current.visibility,
      precipitation: weatherData.current.precipitation || 0,
      uvIndex: Math.round(weatherData.daily.uv_index_max[0]),
      sunrise: new Date(weatherData.daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sunset: new Date(weatherData.daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      high: Math.round(weatherData.daily.temperature_2m_max[0]),
      low: Math.round(weatherData.daily.temperature_2m_min[0])
    };
  }

  /**
   * Gets the appropriate weather icon based on weather code and time of day
   * @param {number} code - Weather condition code
   * @param {number} isDay - 1 for day, 0 for night
   * @returns {string} Material icon name
   */
  const getWeatherIcon = (code, isDay) => {
    const nightIconMap = { 0: 'clear_night', 1: 'clear_night', 2: 'partly_cloudy_night' };
    return isDay === 0 ? (nightIconMap[code] || weatherIcons[code] || 'cloud') : (weatherIcons[code] || 'cloud');
  };
  
  /**
   * Converts weather code to human-readable description
   * @param {number} code - Weather condition code
   * @returns {string} Weather description
   */
  const getWeatherDescription = (code) => {
    const d = { 0: 'Clear', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast', 45: 'Fog', 61: 'Rain', 80: 'Showers', 95: 'Thunderstorm' };
    return d[Object.keys(d).find(key => key >= code) || 0];
  };
  
  /**
   * Converts UV index to descriptive text
   * @param {number} uv - UV index value
   * @returns {string} UV level description
   */
  const getUvDescription = (uv) => {
    if (uv <= 2) return 'Low';
    if (uv <= 5) return 'Moderate';
    if (uv <= 7) return 'High';
    if (uv <= 10) return 'Very High';
    return 'Extreme';
  };
  
  /**
   * Converts wind direction in degrees to compass direction
   * @param {number} deg - Wind direction in degrees (0-360)
   * @returns {string} Compass direction (N, NE, E, etc.)
   */
  const getWindDirection = (deg) => {
    const d = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return d[Math.round(deg / 22.5) % 16];
  };
  
  /**
   * Converts humidity percentage to descriptive text
   * @param {number} h - Humidity percentage
   * @returns {string} Humidity description
   */
  const getHumidityDescription = (h) => {
    if (h <= 30) return 'Dry';
    if (h <= 60) return 'Comfortable';
    return 'Very Humid';
  };
  
  /**
   * Converts pressure value to descriptive text
   * @param {number} p - Atmospheric pressure in hPa
   * @returns {string} Pressure description
   */
  const getPressureDescription = (p) => {
    if (p > 1020) return 'High';
    if (p >= 1000) return 'Normal';
    return 'Low';
  };
  
  /**
   * Shows or hides loading indicator
   * @param {boolean} isLoading - Whether to show loading state
   */
  const showLoading = (isLoading) => {
    loadingEl.style.display = isLoading ? 'flex' : 'none';
    weatherContentEl.classList.toggle('opacity-0', isLoading);
  };
  
  /**
   * Displays error message to user
   * @param {string} message - Error message to display
   */
  const showError = (message) => {
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
  };
  
  /**
   * Hides error message
   */
  const hideError = () => {
    errorEl.classList.add('hidden');
  };

  /**
   * Applies theme mode (light, dark, or amoled) to the application
   * @param {string} mode - Theme mode ('light', 'dark', or 'amoled')
   */
  const applyThemeMode = (mode) => {
    document.documentElement.classList.remove('light', 'dark', 'amoled');
    let themeClass = mode;
    if (mode === 'amoled') themeClass = 'dark amoled';
    document.documentElement.className = themeClass;
    localStorage.setItem('themeMode', mode);
    updateThemeUI();
  };
  
  /**
   * Applies accent color theme to the application
   * @param {string} color - Theme color identifier
   */
  const applyAccentColor = (color) => {
    document.documentElement.setAttribute('data-theme', color);
    localStorage.setItem('themeColor', color);
    updateThemeUI();
  };
  
  /**
   * Updates theme UI elements to reflect current theme settings
   */
  const updateThemeUI = () => {
    const mode = localStorage.getItem('themeMode') || 'light';
    const color = localStorage.getItem('themeColor') || 'm3-purple';
    
    document.querySelectorAll('.theme-mode-btn').forEach(btn => {
      const isActive = btn.dataset.themeMode === mode;
      btn.classList.toggle('bg-secondary-container', isActive);
      btn.classList.toggle('text-on-secondary-container', isActive);
    });
    
    document.querySelectorAll('.color-swatch').forEach(sw => {
      sw.classList.toggle('border-primary', sw.dataset.theme === color);
      sw.classList.toggle('border-transparent', sw.dataset.theme !== color);
    });
    
    setTimeout(() => {
      const computedStyle = getComputedStyle(document.body);
      const bgColor = computedStyle.getPropertyValue('--surface-container-low').trim();
      if (themeColorMeta) themeColorMeta.setAttribute('content', bgColor);
    }, 50);
  };

  /**
   * Handles scroll behavior for top app bar
   * Changes app bar style based on scroll position
   */
  const handleScroll = () => {
    const isLarge = mainScrollContainer.scrollTop <= 50;
    topAppBar.classList.toggle('is-large', isLarge);
    topAppBar.style.backgroundColor = isLarge ? 'transparent' : 'var(--surface-container-low)';
  };

  /**
   * Opens the settings modal and loads saved API key
   */
  const openSettings = () => {
    const savedApiKey = localStorage.getItem('geminiApiKey');
    if (savedApiKey) {
      settingsApiKeyInput.value = savedApiKey;
    }
    settingsModal.classList.remove('pointer-events-none');
    settingsOverlay.classList.remove('pointer-events-none');
    requestAnimationFrame(() => {
      settingsModal.classList.add('is-active');
      settingsOverlay.classList.remove('opacity-0');
    });
  };
  
  /**
   * Closes the settings modal with optional animation
   * @param {boolean} animate - Whether to animate the close transition
   */
  const closeSettings = (animate = true) => {
    if (!settingsModal.classList.contains('is-active')) return;
    if (!animate) {
      settingsModal.classList.remove('is-active', 'is-closing');
      settingsModal.classList.add('pointer-events-none');
      settingsOverlay.classList.add('pointer-events-none', 'opacity-0');
      return;
    }
    settingsModal.classList.add('is-closing');
    settingsOverlay.classList.add('opacity-0');
    const onAnimationEnd = () => {
      settingsModal.classList.remove('is-active', 'is-closing');
      settingsModal.classList.add('pointer-events-none');
      settingsOverlay.classList.add('pointer-events-none');
    };
    settingsContent.addEventListener('animationend', onAnimationEnd, { once: true });
  };

  /**
   * Opens the AI chat modal
   */
  const openAiModal = () => {
    aiModal.classList.remove('pointer-events-none');
    aiModalOverlay.classList.remove('pointer-events-none');
    requestAnimationFrame(() => {
      aiModal.classList.add('is-active');
      aiModalOverlay.classList.remove('opacity-0');
    });
  };
  
  /**
   * Closes the AI chat modal with optional animation
   * @param {boolean} animate - Whether to animate the close transition
   */
  const closeAiModal = (animate = true) => {
    if (!aiModal.classList.contains('is-active')) return;
    if (!animate) {
      aiModal.classList.remove('is-active', 'is-closing');
      aiModal.classList.add('pointer-events-none');
      aiModalOverlay.classList.add('pointer-events-none', 'opacity-0');
      return;
    }
    aiModal.classList.add('is-closing');
    aiModalOverlay.classList.add('opacity-0');
    const onAnimationEnd = () => {
      aiModal.classList.remove('is-active', 'is-closing');
      aiModal.classList.add('pointer-events-none');
      aiModalOverlay.classList.add('pointer-events-none');
    };
    aiModalContent.addEventListener('animationend', onAnimationEnd, { once: true });
  };

  /**
   * Opens the location search view
   */
  const openSearch = () => {
    document.body.classList.add('search-active');
    searchView.classList.remove('hidden');
    requestAnimationFrame(() => {
      searchView.classList.add('is-visible');
    });
    searchInput.focus();
  };
  
  /**
   * Closes the location search view and clears search results
   */
  const closeSearch = () => {
    searchView.classList.remove('is-visible');
    searchView.addEventListener('transitionend', () => {
      document.body.classList.remove('search-active');
      searchView.classList.add('hidden');
      searchInput.value = '';
      searchResultsContainer.innerHTML = '';
    }, { once: true });
  };

  /**
   * Handles location search input with debouncing
   * Queries geocoding API and displays results
   * @param {string} query - Search query string
   */
  const handleSearchInput = debounce(async (query) => {
    if (query.length < 3) {
      searchResultsContainer.innerHTML = '';
      return;
    }
    const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
    try {
      const response = await fetch(geocodeUrl);
      const data = await response.json();
      displaySearchResults(data.results || []);
    } catch (error) {
      console.error("Search failed:", error);
    }
  }, 300);
  
  /**
   * Displays location search results in the UI
   * @param {Array<Object>} results - Array of location results from geocoding API
   */
  function displaySearchResults(results) {
    searchResultsContainer.innerHTML = '';
    if (results.length === 0) {
      searchResultsContainer.innerHTML = `<p class="type-body-large text-on-surface-variant text-center p-4">No results found.</p>`;
      return;
    }
    results.forEach(result => {
      const { name, admin1, country, latitude, longitude } = result;
      const item = document.createElement('button');
      item.className = 'interactive w-full text-left p-4 rounded-lg flex items-center gap-4';
      item.innerHTML = `
        <span class="material-symbols-outlined text-on-surface-variant">location_on</span>
        <div>
          <p class="type-body-large text-on-surface">${name}</p>
          <p class="type-label-large text-on-surface-variant">${[admin1, country].filter(Boolean).join(', ')}</p>
        </div>`;
      item.addEventListener('click', () => {
        const locationData = { lat: latitude, lon: longitude, name: `${name}${admin1 ? ', ' + admin1 : ''}` };
        localStorage.setItem('lastLocation', JSON.stringify(locationData));
        fetchWeather(latitude, longitude, locationData.name);
        closeSearch();
      });
      searchResultsContainer.appendChild(item);
    });
  }

  /**
   * Fetches weather data from Open-Meteo API
   * @param {number} lat - Latitude coordinate
   * @param {number} lon - Longitude coordinate
   * @param {string} name - Location name for display
   */
  async function fetchWeather(lat, lon, name) {
    hideError();
    showLoading(true);
    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl,visibility&hourly=temperature_2m,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=auto&forecast_days=7`;
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();
      updateUI(data, name);
    } catch (error) {
      showError(`Could not fetch weather data. ${error.message}`);
    } finally {
      showLoading(false);
    }
  }
  
  /**
   * Updates all UI elements with weather data
   * @param {Object} data - Weather data from API
   * @param {string} name - Location name
   */
  function updateUI(data, name) {
    currentWeatherData = data;
    locationEl.textContent = name;
    currentTempEl.textContent = `${Math.round(data.current.temperature_2m)}°`;
    feelsLikeEl.textContent = `Feels like ${Math.round(data.current.apparent_temperature)}°`;
    currentConditionEl.textContent = getWeatherDescription(data.current.weather_code);
    currentIconEl.innerHTML = `<span class="material-symbols-outlined !text-7xl">${getWeatherIcon(data.current.weather_code, data.current.is_day)}</span>`;
    updateHourlyForecast(data);
    updateDailyForecast(data);
    updateBentoGrid(data);
    generateGeminiSummary(data);
    weatherContentEl.classList.remove('opacity-0');
  }

  /**
   * Updates the hourly forecast display with next 24 hours
   * @param {Object} data - Weather data containing hourly forecasts
   */
  function updateHourlyForecast(data) {
    hourlyContainer.innerHTML = '';
    const now = new Date();
    const currentHourIndex = data.hourly.time.findIndex(t => new Date(t) >= now) || 0;
    for (let i = currentHourIndex; i < Math.min(currentHourIndex + 24, data.hourly.time.length); i++) {
      const time = new Date(data.hourly.time[i]);
      const temp = Math.round(data.hourly.temperature_2m[i]);
      const hourEl = document.createElement('div');
      hourEl.className = 'flex flex-col items-center flex-shrink-0 space-y-2 p-3 bg-surface-container-high rounded-2xl min-w-[72px] animate-fade-in';
      hourEl.style.animationDelay = `${(i - currentHourIndex) * 50}ms`;
      hourEl.innerHTML = `
        <p class="type-label-large text-on-surface-variant">${i === currentHourIndex ? 'Now' : time.toLocaleTimeString([], { hour: 'numeric', hour12: false })}</p>
        <div class="w-8 h-8 flex-shrink-0 text-primary"><span class="material-symbols-outlined !text-3xl">${getWeatherIcon(data.hourly.weather_code[i], data.hourly.is_day[i])}</span></div>
        <p class="type-title-medium text-on-surface">${temp}°</p>`;
      hourlyContainer.appendChild(hourEl);
    }
  }
  
  /**
   * Updates the 7-day forecast display
   * @param {Object} data - Weather data containing daily forecasts
   */
  function updateDailyForecast(data) {
    dailyContainer.innerHTML = '';
    for (let i = 0; i < 7; i++) {
      const date = new Date(data.daily.time[i]);
      const dayName = i === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
      const tempMin = Math.round(data.daily.temperature_2m_min[i]);
      const tempMax = Math.round(data.daily.temperature_2m_max[i]);
      const dayEl = document.createElement('div');
      dayEl.className = 'flex items-center justify-between py-1 animate-fade-in';
      dayEl.style.animationDelay = `${i * 75}ms`;
      dayEl.innerHTML = `
        <p class="type-body-large w-12 text-on-surface-variant font-medium">${dayName}</p>
        <span class="material-symbols-outlined text-secondary mx-4">${getWeatherIcon(data.daily.weather_code[i], 1)}</span>
        <p class="type-body-large text-on-surface-variant w-8 text-right">${tempMin}°</p>
        <div class="flex-1 mx-2 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-secondary to-primary" style="width: 100%;"></div>
        </div>
        <p class="type-body-large text-on-surface font-medium w-8 text-right">${tempMax}°</p>`;
      dailyContainer.appendChild(dayEl);
    }
  }

  /**
   * Updates the bento grid with detailed weather metrics
   * @param {Object} data - Weather data containing current conditions
   */
  function updateBentoGrid(data) {
    bentoGrid.innerHTML = '';
    const details = [
      { icon: 'wb_twilight', title: 'Sun Cycle', value: new Date(data.daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }), unit: '', desc: `Sunset at ${new Date(data.daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`, col: 'col-span-4', row: 'row-span-2' },
      { icon: 'air', title: 'Wind', value: Math.round(data.current.wind_speed_10m || 0), unit: 'km/h', desc: getWindDirection(data.current.wind_direction_10m), col: 'col-span-2', row: '' },
      { icon: 'water_drop', title: 'Humidity', value: data.current.relative_humidity_2m, unit: '%', desc: getHumidityDescription(data.current.relative_humidity_2m), col: 'col-span-2', row: '' },
      { icon: 'thermostat_carbon', title: 'UV Index', value: Math.round(data.daily.uv_index_max[0] || 0), unit: '', desc: getUvDescription(data.daily.uv_index_max[0]), col: 'col-span-2', row: '' },
      { icon: 'compress', title: 'Pressure', value: Math.round(data.current.pressure_msl || 1013), unit: 'hPa', desc: getPressureDescription(data.current.pressure_msl), col: 'col-span-2', row: '' },
    ];
    
    details.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = `interactive m3-card bg-surface-container p-4 rounded-3xl flex flex-col justify-between min-h-[120px] animate-fade-in ${item.col} ${item.row}`;
      card.style.animationDelay = `${300 + index * 75}ms`;
      card.innerHTML = `
        <div>
          <div class="flex items-center gap-2 text-on-surface-variant type-label-large mb-1">
            <span class="material-symbols-outlined text-secondary" style="font-size: 20px;">${item.icon}</span>
            <h4>${item.title}</h4>
          </div>
        </div>
        <div class="text-right">
          <p class="type-headline-medium text-on-surface">
            ${item.value}<span class="type-body-large">${item.unit}</span>
          </p>
          <p class="type-body-large text-on-surface-variant truncate">${item.desc}</p>
        </div>`;
      bentoGrid.appendChild(card);
    });
  }

  /**
   * Async generator for streaming Server-Sent Events (SSE)
   * @param {ReadableStream} stream - Response body stream
   * @yields {Object} Parsed JSON chunks from SSE stream
   */
  async function* streamAsyncIterable(stream) {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            try {
              yield JSON.parse(data);
            } catch (e) {
              console.error('Failed to parse SSE data:', e, data);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Calls Google Gemini API with streaming support
   * @param {string} apiKey - Google Gemini API key
   * @param {Object} payload - Request payload with prompt and configuration
   * @returns {Promise<ReadableStream>} Response body stream
   * @throws {Error} If API request fails
   */
  async function callGeminiStream(apiKey, payload) {
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`;
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API request failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }
    
    return response.body;
  }

  /**
   * Streams Gemini API response with real-time text updates
   * @param {string} apiKey - Google Gemini API key
   * @param {string} prompt - User prompt/question
   * @param {string} systemInstruction - System instructions for AI behavior
   * @param {Function} onTextUpdate - Callback for text updates
   * @param {number} maxTokens - Maximum tokens to generate
   * @param {number} temp - Temperature for response randomness (0-1)
   * @returns {Promise<string>} Complete accumulated response text
   */
  async function streamGeminiResponse(apiKey, prompt, systemInstruction, onTextUpdate, maxTokens = 800, temp = 0.8) {
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      generationConfig: {
        temperature: temp,
        maxOutputTokens: maxTokens
      }
    };
    
    const stream = await callGeminiStream(apiKey, payload);
    let accumulatedText = '';
    
    for await (const chunk of streamAsyncIterable(stream)) {
      if (chunk.candidates && chunk.candidates[0]?.content?.parts) {
        const text = chunk.candidates[0].content.parts[0]?.text || '';
        accumulatedText += text;
        onTextUpdate(accumulatedText);
      }
    }
    
    return accumulatedText;
  }

  /**
   * Adds a "thinking" indicator message to the conversation
   * @returns {HTMLElement} The thinking message element
   */
  function addThinkingMessage() {
    const conversationContainer = document.getElementById('gemini-conversation-container');
    aiWelcomeMessage.classList.add('hidden');
    conversationContainer.classList.remove('hidden');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message-bubble assistant-message animate-fade-in';
    messageDiv.id = 'thinking-indicator';
    messageDiv.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
          <span class="material-symbols-outlined text-on-secondary !text-lg">auto_awesome</span>
        </div>
        <div class="type-body-large text-on-surface-variant">Thinking...</div>
      </div>`;
    
    conversationContainer.appendChild(messageDiv);
    conversationScrollArea.scrollTop = conversationScrollArea.scrollHeight;
    
    return messageDiv;
  }
  
  /**
   * Adds a message to the AI conversation display
   * @param {string} role - Message role ('user' or 'assistant')
   * @param {string} content - Message content
   * @param {boolean} isStreaming - Whether message is being streamed
   * @returns {HTMLElement} The created message element
   */
  function addMessageToConversation(role, content, isStreaming = false) {
    const conversationContainer = document.getElementById('gemini-conversation-container');
    aiWelcomeMessage.classList.add('hidden');
    conversationContainer.classList.remove('hidden');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message-bubble ${role === 'user' ? 'user-message' : 'assistant-message'} animate-fade-in`;
    
    if (role === 'user') {
      messageDiv.innerHTML = `
        <div class="flex items-start gap-3 justify-end">
          <div class="bg-primary text-on-primary px-4 py-3 rounded-2xl rounded-tr-sm max-w-[80%]">
            <p class="type-body-large whitespace-pre-wrap">${content}</p>
          </div>
          <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
            <span class="material-symbols-outlined text-on-primary !text-lg">person</span>
          </div>
        </div>`;
    } else {
      messageDiv.innerHTML = `
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
            <span class="material-symbols-outlined text-on-secondary !text-lg">auto_awesome</span>
          </div>
          <div class="bg-surface-container text-on-surface px-4 py-3 rounded-2xl rounded-tl-sm max-w-[80%]">
            <div class="message-content type-body-large">${isStreaming ? '<span class="typing-cursor"></span>' : content}</div>
          </div>
        </div>`;
    }
    
    conversationContainer.appendChild(messageDiv);
    conversationScrollArea.scrollTop = conversationScrollArea.scrollHeight;
    
    return messageDiv;
  }

  /**
   * Main function to handle AI chat with weather context
   * Streams responses from Gemini API with weather data context
   * @param {string} prompt - User's question
   * @param {string} apiKey - Google Gemini API key
   * @param {Object} weatherData - Current weather data for context
   */
  const callGeminiApiStreaming = async (prompt, apiKey, weatherData) => {
    const conversationContainer = document.getElementById('gemini-conversation-container');
    
    document.querySelectorAll('.follow-up-container').forEach(el => el.remove());
    
    addMessageToConversation('user', prompt);
    conversationHistory.push({ role: 'user', content: prompt });
    
    thinkingMessage = addThinkingMessage();
    
    aiSendBtn.disabled = true;
    
    const locationName = getLocationName();
    const currentWeather = createCurrentWeatherObject(weatherData);
    
    const now = new Date();
    const currentHourIndex = weatherData.hourly.time.findIndex(t => new Date(t) >= now) || 0;
    const hourlyForecast = [];
    for (let i = currentHourIndex; i < Math.min(currentHourIndex + 12, weatherData.hourly.time.length); i++) {
      hourlyForecast.push({
        time: new Date(weatherData.hourly.time[i]).toLocaleTimeString([], { hour: 'numeric' }),
        temp: Math.round(weatherData.hourly.temperature_2m[i]),
        condition: getWeatherDescription(weatherData.hourly.weather_code[i])
      });
    }
    
    const dailyForecast = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weatherData.daily.time[i]);
      dailyForecast.push({
        day: i === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' }),
        high: Math.round(weatherData.daily.temperature_2m_max[i]),
        low: Math.round(weatherData.daily.temperature_2m_min[i]),
        condition: getWeatherDescription(weatherData.daily.weather_code[i])
      });
    }
    
    const weatherContext = `
LOCATION: ${currentWeather.location}
CURRENT CONDITIONS:
- Temperature: ${currentWeather.temperature}°C (feels like ${currentWeather.feelsLike}°C)
- Condition: ${currentWeather.condition}
- Humidity: ${currentWeather.humidity}%
- Wind: ${currentWeather.windSpeed}km/h ${currentWeather.windDirection}
- Pressure: ${currentWeather.pressure}hPa
- Visibility: ${(currentWeather.visibility / 1000).toFixed(1)}km
- Precipitation: ${currentWeather.precipitation}mm
- UV Index: ${currentWeather.uvIndex}
- Sunrise: ${currentWeather.sunrise}, Sunset: ${currentWeather.sunset}
HOURLY FORECAST (Next 12 hours):
${hourlyForecast.map(h => `${h.time}: ${h.temp}°C, ${h.condition}`).join('\n')}
7-DAY FORECAST:
${dailyForecast.map(d => `${d.day}: High ${d.high}°C, Low ${d.low}°C, ${d.condition}`).join('\n')}`;

    const systemInstructionText = `You are a helpful weather assistant providing information about ${locationName}. 
IMPORTANT INSTRUCTIONS:
1. Answer questions naturally and conversationally based on ALL the provided weather data.
2. Use the hourly forecast to answer questions about timing (like "how long will rain last").
3. Use the location name (${locationName}) in your responses when relevant.
4. Be specific with times, temperatures, and conditions.
5. Don't say "the data doesn't show" - analyze the hourly and daily forecasts to provide estimates.
6. After your response, suggest 2-3 SHORT follow-up questions (max 6 words each).
7. Format follow-up questions as: "Follow-up: [question]"`;

    const userPromptText = `
Weather Data:
${weatherContext}

User Question: ${prompt}`;

    try {
      let fullResponse = '';
      
      await streamGeminiResponse(
        apiKey,
        userPromptText,
        systemInstructionText,
        (accumulatedText) => {
          if (thinkingMessage && thinkingMessage.parentNode) {
            thinkingMessage.remove();
            thinkingMessage = null;
            
            const assistantMessage = addMessageToConversation('assistant', '', true);
            const messageContent = assistantMessage.querySelector('.message-content');
            
            window.currentMessageContent = messageContent;
          }
          
          fullResponse = accumulatedText;
          const mainResponse = accumulatedText.split('Follow-up:')[0];
          if (window.currentMessageContent) {
            window.currentMessageContent.innerHTML = marked.parse(mainResponse);
          }
          conversationScrollArea.scrollTop = conversationScrollArea.scrollHeight;
        },
        800
      );
      
      conversationHistory.push({ role: 'assistant', content: fullResponse });
      
      const followUpLines = fullResponse.match(/Follow-up: .*/g) || [];
      if (followUpLines.length > 0) {
        const followUpDiv = document.createElement('div');
        followUpDiv.className = 'follow-up-container flex flex-wrap gap-2 mt-3 ml-11 animate-fade-in';
        followUpDiv.innerHTML = followUpLines.map(q => {
          const question = q.replace('Follow-up: ', '').trim();
          return `<button class="follow-up-btn interactive type-label-small bg-tertiary-container text-on-tertiary-container px-3 py-1.5 rounded-full">${question}</button>`;
        }).join('');
        conversationContainer.appendChild(followUpDiv);
        conversationScrollArea.scrollTop = conversationScrollArea.scrollHeight;
      }
      
      aiSendBtn.disabled = false;
      
    } catch (error) {
      if (thinkingMessage && thinkingMessage.parentNode) {
        thinkingMessage.remove();
        thinkingMessage = null;
      }
      
      const errorMessage = addMessageToConversation('assistant', `Error: ${error.message}. Please check your API key in settings.`);
      errorMessage.querySelector('.message-content').classList.add('text-red-500');
      
      aiSendBtn.disabled = false;
      console.error('Gemini API Error:', error);
    }
  };

  /**
   * Generates an intelligent weather summary with contextual insights
   * Analyzes current conditions, trends, and provides personalized advice
   * @param {Object} weatherData - Complete weather data from API
   */
  const generateGeminiSummary = (weatherData) => {
    const summaryElement = document.getElementById('ai-summary-text');
    const w = createCurrentWeatherObject(weatherData);
    
    const now = new Date();
    const currentHourIndex = weatherData.hourly.time.findIndex(t => new Date(t) >= now) || 0;
    const next6Hours = weatherData.hourly.temperature_2m.slice(currentHourIndex, currentHourIndex + 6);
    const tempTrend = next6Hours.length > 3 ? (next6Hours[next6Hours.length - 1] - next6Hours[0]) : 0;
    
    const comfortIndex = Math.max(0, Math.min(100, 
      100 - Math.abs(w.temperature - 22) * 3 - 
      Math.abs(w.humidity - 50) * 0.3 - 
      Math.max(0, w.windSpeed - 20) * 0.5 -
      Math.max(0, w.uvIndex - 5) * 2
    ));
    
    const hour = new Date().getHours();
    const isMorning = hour >= 5 && hour < 12;
    const isAfternoon = hour >= 12 && hour < 17;
    const isEvening = hour >= 17 && hour < 21;
    const isNight = hour >= 21 || hour < 5;
    const tempDiff = w.high - w.low;
    const feelsLikeDiff = w.temperature - w.feelsLike;
    
    const dailyTemps = weatherData.daily.temperature_2m_max.slice(0, 3);
    const tempPattern = dailyTemps[1] > dailyTemps[0] ? 'warming' : dailyTemps[1] < dailyTemps[0] ? 'cooling' : 'stable';
    
    const currentCode = weatherData.current.weather_code;
    const futureWeatherCodes = weatherData.hourly.weather_code.slice(currentHourIndex, currentHourIndex + 12);
    const weatherChanging = futureWeatherCodes.some(code => Math.abs(code - currentCode) > 10);
    
    let summary = '';
    let mainPart = '';
    let detailPart = '';
    
    if (w.condition.includes('Clear')) {
      const clearVariants = [
        { cond: comfortIndex > 85 && w.temperature >= 18 && w.temperature <= 26, text: `Gorgeous ${w.temperature}° with brilliant sunshine` },
        { cond: comfortIndex > 80 && w.temperature >= 20 && w.temperature <= 24, text: `Delightful ${w.temperature}° under clear blue skies` },
        { cond: w.temperature > 32, text: `Blazing ${w.temperature}° with intense sunshine` },
        { cond: w.temperature > 28 && w.temperature <= 32, text: `Hot ${w.temperature}° with uninterrupted sun` },
        { cond: w.temperature < 5, text: `Crisp ${w.temperature}° with crystal clear skies` },
        { cond: w.temperature >= 5 && w.temperature < 10, text: `Brisk ${w.temperature}° but beautifully clear` },
        { cond: w.temperature >= 10 && w.temperature < 15, text: `Cool ${w.temperature}° with pleasant sunshine` },
        { cond: isMorning && w.temperature < 18, text: `Refreshing ${w.temperature}° morning, sunshine ahead` },
        { cond: isEvening && w.temperature > 20, text: `Lovely ${w.temperature}° evening with clear skies` },
        { cond: isNight, text: `Clear ${w.temperature}° night with starry skies` },
        { cond: w.windSpeed > 25, text: `Sunny but breezy ${w.temperature}° with ${w.windSpeed}km/h winds` },
        { cond: true, text: `Bright ${w.temperature}° with clear conditions` }
      ];
      mainPart = clearVariants.find(v => v.cond).text;
      
    } else if (w.condition.includes('Partly') || w.condition.includes('Mainly')) {
      const partlyVariants = [
        { cond: w.temperature > 28, text: `Warm ${w.temperature}° with sun breaking through clouds` },
        { cond: w.temperature >= 20 && w.temperature <= 28, text: `Pleasant ${w.temperature}° with mixed sun and clouds` },
        { cond: w.temperature < 15, text: `Cool ${w.temperature}° with partly cloudy skies` },
        { cond: isMorning, text: `${w.temperature}° this morning, clouds clearing gradually` },
        { cond: isAfternoon, text: `${w.temperature}° with afternoon clouds rolling in` },
        { cond: w.humidity > 70, text: `${w.temperature}° with hazy clouds and ${w.humidity}% humidity` },
        { cond: true, text: `${w.temperature}° with intermittent sunshine` }
      ];
      mainPart = partlyVariants.find(v => v.cond).text;
      
    } else if (w.condition.includes('Overcast') || w.condition.includes('Cloud')) {
      const cloudyVariants = [
        { cond: w.temperature > 28 && w.humidity > 70, text: `Oppressive ${w.temperature}° under thick cloud cover` },
        { cond: w.temperature > 25, text: `Warm ${w.temperature}° despite overcast skies` },
        { cond: w.temperature < 10, text: `Gloomy ${w.temperature}° with heavy cloud cover` },
        { cond: w.temperature >= 10 && w.temperature < 18, text: `Mild ${w.temperature}° but completely overcast` },
        { cond: w.humidity > 80, text: `Damp ${w.temperature}° with dense clouds` },
        { cond: weatherChanging, text: `${w.temperature}° and cloudy, conditions may change` },
        { cond: true, text: `Gray ${w.temperature}° with persistent clouds` }
      ];
      mainPart = cloudyVariants.find(v => v.cond).text;
      
    } else if (w.condition.includes('Rain') || w.condition.includes('Shower')) {
      const rainyVariants = [
        { cond: w.temperature < 10, text: `Cold ${w.temperature}° with steady rain` },
        { cond: w.temperature >= 10 && w.temperature < 15, text: `Chilly ${w.temperature}° rain throughout the day` },
        { cond: w.temperature >= 15 && w.temperature < 20, text: `Mild ${w.temperature}° with persistent showers` },
        { cond: w.temperature >= 20 && w.humidity > 75, text: `Muggy ${w.temperature}° with heavy rainfall` },
        { cond: w.windSpeed > 30, text: `Stormy ${w.temperature}° with wind-driven rain` },
        { cond: w.precipitation > 5, text: `Wet ${w.temperature}° with significant rainfall` },
        { cond: true, text: `Rainy ${w.temperature}° conditions` }
      ];
      mainPart = rainyVariants.find(v => v.cond).text;
      
    } else if (w.condition.includes('Thunder')) {
      mainPart = `Stormy ${w.temperature}° with thunderstorms`;
    } else if (w.condition.includes('Snow')) {
      mainPart = `Snowy ${w.temperature}° with winter conditions`;
    } else if (w.condition.includes('Fog')) {
      mainPart = `Foggy ${w.temperature}° with limited visibility`;
    } else {
      mainPart = `${w.condition} at ${w.temperature}°`;
    }
    
    const detailOptions = [];
    
    if (tempTrend > 6) {
      detailOptions.push({ priority: 8, text: `, warming to ${w.high}° within hours` });
    } else if (tempTrend > 3) {
      detailOptions.push({ priority: 7, text: `, gradually rising to ${w.high}°` });
    } else if (tempTrend < -6) {
      detailOptions.push({ priority: 8, text: `, cooling down to ${w.low}° soon` });
    } else if (tempTrend < -3) {
      detailOptions.push({ priority: 7, text: `, slowly dropping to ${w.low}°` });
    }
    
    if (isMorning && w.high - w.temperature > 12) {
      detailOptions.push({ priority: 7, text: `, expect ${w.high}° by mid-afternoon` });
    } else if (isMorning && w.high - w.temperature > 8) {
      detailOptions.push({ priority: 6, text: `, reaching ${w.high}° later today` });
    } else if (isAfternoon && w.temperature - w.low > 10) {
      detailOptions.push({ priority: 7, text: `, cooling to ${w.low}° overnight` });
    } else if (isEvening && w.temperature - w.low > 8) {
      detailOptions.push({ priority: 6, text: `, dropping to ${w.low}° by morning` });
    }
    
    if (tempDiff > 18) {
      detailOptions.push({ priority: 6, text: ` with a dramatic ${tempDiff}° swing today` });
    } else if (tempDiff > 15) {
      detailOptions.push({ priority: 5, text: ` with a ${tempDiff}° temperature range` });
    } else if (tempDiff < 5) {
      detailOptions.push({ priority: 4, text: `, staying steady all day` });
    }
    
    if (feelsLikeDiff < -8) {
      detailOptions.push({ priority: 9, text: `, but feels like ${w.feelsLike}° with wind chill` });
    } else if (feelsLikeDiff < -4) {
      detailOptions.push({ priority: 8, text: `, feels cooler at ${w.feelsLike}° due to wind` });
    } else if (feelsLikeDiff > 8) {
      detailOptions.push({ priority: 9, text: `, but feels like ${w.feelsLike}° with humidity` });
    } else if (feelsLikeDiff > 4) {
      detailOptions.push({ priority: 8, text: `, feels warmer at ${w.feelsLike}° due to humidity` });
    }
    
    if (tempPattern === 'warming' && dailyTemps[1] - dailyTemps[0] > 6) {
      detailOptions.push({ priority: 6, text: `. Significant warming trend this week` });
    } else if (tempPattern === 'warming' && dailyTemps[1] - dailyTemps[0] > 3) {
      detailOptions.push({ priority: 5, text: `. Temperatures rising in coming days` });
    } else if (tempPattern === 'cooling' && dailyTemps[0] - dailyTemps[1] > 6) {
      detailOptions.push({ priority: 6, text: `. Notable cooling trend ahead` });
    } else if (tempPattern === 'cooling' && dailyTemps[0] - dailyTemps[1] > 3) {
      detailOptions.push({ priority: 5, text: `. Cooler weather approaching` });
    }
    
    if (weatherChanging) {
      detailOptions.push({ priority: 7, text: `. Conditions expected to change` });
    }
    
    detailOptions.sort((a, b) => b.priority - a.priority);
    if (detailOptions.length > 0) {
      detailPart = detailOptions[0].text;
    }
    
    summary = mainPart + detailPart;
    
    const adviceOptions = [];
    
    if (w.uvIndex >= 9 && hour >= 9 && hour <= 16) {
      adviceOptions.push({ priority: 10, text: '. Extreme UV—stay protected' });
    } else if (w.uvIndex >= 8 && hour >= 9 && hour <= 16) {
      adviceOptions.push({ priority: 9, text: '. Very high UV—use sunscreen' });
    } else if (w.uvIndex >= 6 && hour >= 10 && hour <= 15) {
      adviceOptions.push({ priority: 7, text: '. High UV levels—protect skin' });
    }
    
    if (w.windSpeed > 50) {
      adviceOptions.push({ priority: 10, text: '. Dangerous winds—stay indoors' });
    } else if (w.windSpeed > 40) {
      adviceOptions.push({ priority: 9, text: `. Very windy at ${w.windSpeed}km/h` });
    } else if (w.windSpeed > 30) {
      adviceOptions.push({ priority: 7, text: `. Breezy with ${w.windSpeed}km/h gusts` });
    }
    
    if (w.humidity > 90 && w.temperature > 22) {
      adviceOptions.push({ priority: 8, text: '. Extremely humid conditions' });
    } else if (w.humidity > 80 && w.temperature > 24) {
      adviceOptions.push({ priority: 7, text: '. Very humid and uncomfortable' });
    } else if (w.humidity < 25) {
      adviceOptions.push({ priority: 6, text: '. Very dry air—stay hydrated' });
    }
    
    if (w.condition.includes('Rain') && w.precipitation > 10) {
      adviceOptions.push({ priority: 9, text: '. Heavy rain—avoid travel' });
    } else if (w.condition.includes('Rain')) {
      adviceOptions.push({ priority: 7, text: '. Bring an umbrella' });
    }
    
    if (comfortIndex > 90 && w.condition.includes('Clear')) {
      adviceOptions.push({ priority: 7, text: '. Perfect for outdoor activities' });
    } else if (comfortIndex > 85) {
      adviceOptions.push({ priority: 6, text: '. Great weather for being outside' });
    }
    
    if (tempDiff > 18 && (isMorning || isNight)) {
      adviceOptions.push({ priority: 8, text: '. Layer up for temperature swings' });
    } else if (tempDiff > 15 && isMorning) {
      adviceOptions.push({ priority: 6, text: '. Dress in layers today' });
    }
    
    if (w.visibility < 1000) {
      adviceOptions.push({ priority: 9, text: '. Poor visibility—drive carefully' });
    }
    
    adviceOptions.sort((a, b) => b.priority - a.priority);
    if (adviceOptions.length > 0) {
      summary += adviceOptions[0].text;
    }
    
    summaryElement.textContent = summary + '.';
  };

  /**
   * Initializes the application
   * Attempts to load last location or use geolocation, falls back to default location
   */
  function initializeApp() {
    const lastLocation = JSON.parse(localStorage.getItem('lastLocation'));
    if (lastLocation) {
      fetchWeather(lastLocation.lat, lastLocation.lon, lastLocation.name);
      return;
    }
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const geoResponse = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
            const geoData = await geoResponse.json();
            const locationName = geoData.city || geoData.locality || 'Current Location';
            const locationData = { lat: latitude, lon: longitude, name: locationName };
            localStorage.setItem('lastLocation', JSON.stringify(locationData));
            fetchWeather(latitude, longitude, locationName);
          } catch (error) {
            console.error("Reverse geocoding failed:", error);
            showError("Could not determine location. Showing fallback.");
            fetchWeather(46.8182, 8.2275, 'Switzerland');
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          showError("Geolocation denied. Showing fallback. Please enable location or search.");
          fetchWeather(46.8182, 8.2275, 'Switzerland');
        }
      );
    } else {
      showError("Geolocation not supported. Showing fallback.");
      fetchWeather(46.8182, 8.2275, 'Switzerland');
    }
  }

  // Theme mode button event listeners
  document.querySelectorAll('.theme-mode-btn').forEach(btn => 
    btn.addEventListener('click', () => applyThemeMode(btn.dataset.themeMode))
  );
  
  // Color swatch event listeners
  document.querySelectorAll('.color-swatch').forEach(swatch => 
    swatch.addEventListener('click', () => applyAccentColor(swatch.dataset.theme))
  );

  // Ripple effect for interactive elements
  document.body.addEventListener('click', function(e) {
    const button = e.target.closest('.interactive');
    if (button) {
      const ripple = document.createElement('span');
      const rect = button.getBoundingClientRect();
      ripple.className = 'ripple';
      
      const size = Math.max(rect.width, rect.height);
      ripple.style.height = ripple.style.width = size + 'px';
      ripple.style.left = e.clientX - rect.left - size / 2 + 'px';
      ripple.style.top = e.clientY - rect.top - size / 2 + 'px';
      
      button.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    }
  });

  // Follow-up question button handler
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('follow-up-btn')) {
      const prompt = e.target.textContent;
      const apiKey = localStorage.getItem('geminiApiKey');
      if (prompt && apiKey && currentWeatherData) {
        aiInput.value = prompt;
        aiInput.dispatchEvent(new Event('input'));
        callGeminiApiStreaming(prompt, apiKey, currentWeatherData);
      }
    }
  });

  // Scroll handler for app bar
  mainScrollContainer.addEventListener('scroll', handleScroll);
  
  // Settings modal event listeners
  settingsToggle.addEventListener('click', openSettings);
  settingsOverlay.addEventListener('click', () => closeSettings());
  settingsCloseBtn.addEventListener('click', () => closeSettings());

  // API key save handler
  saveApiKeyBtn.addEventListener('click', () => {
    const apiKey = settingsApiKeyInput.value.trim();
    if (apiKey) {
      localStorage.setItem('geminiApiKey', apiKey);
      saveApiKeyBtn.textContent = 'Saved!';
      saveApiKeyBtn.classList.remove('bg-secondary-container', 'text-on-secondary-container');
      saveApiKeyBtn.classList.add('bg-primary', 'text-on-primary');
      
      if (currentWeatherData) {
        generateGeminiSummary(currentWeatherData);
      }
      
      setTimeout(() => {
        saveApiKeyBtn.textContent = 'Save';
        saveApiKeyBtn.classList.add('bg-secondary-container', 'text-on-secondary-container');
        saveApiKeyBtn.classList.remove('bg-primary', 'text-on-primary');
        closeSettings();
      }, 1500);
    } else {
      settingsApiKeyInput.focus();
    }
  });
  
  // AI modal event listeners
  aiFab.addEventListener('click', openAiModal);
  aiModalOverlay.addEventListener('click', () => closeAiModal());
  aiModalCloseBtn.addEventListener('click', () => closeAiModal());

  // AI input validation
  aiInput.addEventListener('input', () => {
    const length = aiInput.value.length;
    aiSendBtn.disabled = length === 0 || length > 500;
  });
  
  // Enter key to send message
  aiInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!aiSendBtn.disabled) {
        aiSendBtn.click();
      }
    }
  });
  
  // Quick prompt buttons
  document.querySelectorAll('.quick-prompt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const prompt = btn.dataset.prompt;
      aiInput.value = prompt;
      aiInput.dispatchEvent(new Event('input'));
      aiInput.focus();
    });
  });
  
  // Clear conversation button
  aiClearBtn.addEventListener('click', () => {
    conversationHistory = [];
    const conversationContainer = document.getElementById('gemini-conversation-container');
    conversationContainer.innerHTML = '';
    conversationContainer.classList.add('hidden');
    aiWelcomeMessage.classList.remove('hidden');
  });

  // Send message button
  aiSendBtn.addEventListener('click', () => {
    const prompt = aiInput.value.trim();
    const apiKey = localStorage.getItem('geminiApiKey');
    
    if (!apiKey) {
      addMessageToConversation('assistant', 'Please add your Google Gemini API Key in the settings to use this feature. Click the settings icon in the top right corner.');
      return;
    }
    
    if (prompt && currentWeatherData) {
      callGeminiApiStreaming(prompt, apiKey, currentWeatherData);
      aiInput.value = '';
      aiInput.style.height = 'auto';
      aiInput.dispatchEvent(new Event('input'));
    }
  });

  // Search event listeners
  searchIconBtn.addEventListener('click', openSearch);
  searchBackBtn.addEventListener('click', closeSearch);
  searchInput.addEventListener('input', () => handleSearchInput(searchInput.value));

  // Initialize theme and start app
  applyThemeMode(localStorage.getItem('themeMode') || 'light');
  applyAccentColor(localStorage.getItem('themeColor') || 'm3-purple');
  handleScroll();
  initializeApp();
});
