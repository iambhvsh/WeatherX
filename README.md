# WeatherX 🌤️

A modern, responsive weather application built with Material Design 3 (Material You) principles, featuring AI-powered weather insights using Google Gemini.

## ✨ Features

- 🌡️ **Real-time Weather Data** - Accurate weather information from Open-Meteo API
- 🤖 **AI Weather Assistant** - Chat with Gemini AI for personalized weather insights
- 🎨 **Dynamic Theming** - Multiple color schemes with light, dark, and AMOLED modes
- 📅 **7-Day Forecast** - Detailed weekly weather predictions
- ⏰ **Hourly Updates** - Hour-by-hour weather tracking
- 🔍 **Location Search** - Find weather for any city worldwide
- 📱 **Responsive Design** - Works seamlessly on all devices
- 🎯 **Material Design 3** - Beautiful, modern UI following Material You guidelines

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm (v8 or higher)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/weatherx.git
cd weatherx
```

2. Install dependencies:
```bash
pnpm install
```

3. Start the development server:
```bash
pnpm dev
```

4. Open your browser and navigate to `http://localhost:3000`

### Building for Production

```bash
pnpm build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
pnpm preview
```

## 🔑 API Configuration

### Google Gemini API Key

To use the AI weather assistant feature:

1. Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Open the app settings (gear icon)
3. Enter your API key in the "Google Gemini API Key" field
4. Click "Save"

The API key is stored locally in your browser.

## 🛠️ Tech Stack

- **Frontend Framework**: Vanilla JavaScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4 + Custom CSS
- **Design System**: Material Design 3
- **AI Integration**: Google Gemini 2.5 Flash
- **Weather API**: Open-Meteo
- **Geocoding**: Open-Meteo Geocoding API

## 📁 Project Structure

```
weatherx/
├── assets/
│   ├── app.js          # Main application logic
│   └── styles.css      # Custom styles with Material Design 3
├── index.html          # Main HTML file
├── vite.config.js      # Vite configuration
├── tailwind.config.js  # Tailwind CSS configuration
├── package.json        # Project dependencies
└── README.md          # Project documentation
```

## 🎨 Customization

### Theme Colors

The app includes 5 pre-built color themes:
- Purple (default)
- Blue
- Green
- Orange
- Red

You can switch themes in the settings panel.

### Display Modes

- **Light Mode** - Bright, clean interface
- **Dark Mode** - Easy on the eyes in low light
- **AMOLED Mode** - Pure black backgrounds for OLED displays

## 🌐 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Opera (latest)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Bhavesh Patil**
- GitHub: [@iambhvsh](https://github.com/iambhvsh)

## 🙏 Acknowledgments

- Weather data provided by [Open-Meteo](https://open-meteo.com/)
- AI powered by [Google Gemini](https://deepmind.google/technologies/gemini/)
- Icons from [Material Symbols](https://fonts.google.com/icons)
- Design inspired by [Material Design 3](https://m3.material.io/)

## 📸 Screenshots

![WeatherX Screenshot](screenshot.png)

---

Made with ❤️ using Material Design 3
