# Guess The Song

A vintage-themed music guessing web application built with React, Vite, and Tailwind CSS. The app features an interactive vinyl turntable interface, customizable tracks, and pure client-side storage.

## Overview

Guess The Song is an interactive music game designed for gatherings, music quizzes, and group activities. Players listen to short song previews on a rotating vinyl turntable and guess the song title before revealing the answer.

## Key Features

- **Interactive Vinyl Player**: Authentic vinyl turntable aesthetics with continuous 33 RPM rotation, needle arm tracking, and configurable playback duration.
- **Track Selection Board**: Responsive track grid that reveals the song title beneath the number once a track is solved.
- **Track Customization**:
  - Adjust the total number of questions (presets for 4, 6, 8, 12, 16, 20 tracks or custom counts).
  - Edit song titles and answers directly.
  - Upload custom audio files (.mp3, .wav, .m4a) with live preview and revert options.
- **Client-Side Storage**:
  - Track metadata and game progress are stored in `localStorage`.
  - Custom audio files are stored in browser `IndexedDB`, avoiding storage quota limitations.
  - No server or database required.
- **Countdown Timer Tool**: An integrated circular timer with custom minutes and seconds settings, sound effects, and quick presets.
- **Celebration Effects**: Confetti animations and victory fanfare audio upon revealing answers and completing all tracks.

## Getting Started

### Prerequisites

- Node.js (version 18 or higher recommended)
- npm or yarn

### Installation & Run

1. Clone the repository:
   ```bash
   git clone https://github.com/harytran0407/GuessTheSong.git
   cd GuessTheSong
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## License

This project is licensed under the MIT License.
