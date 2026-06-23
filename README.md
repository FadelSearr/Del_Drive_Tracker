# 🏎️ Del Road

Del Road is a high-performance React Native (Expo) application designed to track your drives, record dashcam footage, and analyze your driving telemetry in real-time. Whether you are doing casual drives, road trips, or track days, Del Road keeps a beautiful log of your journeys.

![Del Road Banner](https://img.shields.io/badge/React_Native-Expo-000?style=for-the-badge&logo=react)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)

## ✨ Features

- **📍 Real-time Telemetry:** Live tracking of Speed, GPS coordinates, Accuracy, and G-Force.
- **🎥 Built-in Dashcam:** Record front or rear-facing video while driving.
- **🕶️ HUD Mode (Head-Up Display):** A stunning, neon-styled digital speedometer overlay designed for driving. Supports full-screen landscape & portrait modes.
- **🗺️ Interactive Maps:** View your recorded drives with a heatmap of your speed on interactive maps.
- **📱 Instagram Stories Integration:** Share your drives directly to Instagram Stories! Your drive data is overlaid as an interactive, transparent sticker on top of your recorded dashcam video.
- **☁️ Cloud Sync:** Securely save your drive history and telemetry to the cloud using Supabase and Google Sign-In.

## 🛠️ Tech Stack

- **Framework:** [Expo](https://expo.dev/) (React Native)
- **Styling:** Native StyleSheet + Tailwind CSS
- **Backend & Auth:** [Supabase](https://supabase.com/)
- **Maps:** `react-native-maps`
- **Camera:** `react-native-vision-camera`
- **Sensors:** `expo-location`, `expo-sensors`
- **Sharing:** `react-native-share`, `expo-sharing`

## 🚀 Getting Started

### Prerequisites

- Node.js (>= 18.x)
- npm or yarn
- Expo CLI
- Supabase Project (for backend)
- Google Cloud Console Project (for Google Sign-In Client ID)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/del-road.git
   cd del-road
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Set up your Supabase URL, Supabase Anon Key, and Google Web Client ID in the respective service files.

4. **Start the development server**
   ```bash
   npx expo start
   ```

5. **Build APK for Android (EAS)**
   ```bash
   eas build --platform android --profile preview
   ```

## 📸 Screenshots

*(Add your screenshots here)*

## 🔐 Google Sign-In Configuration

To avoid `DEVELOPER_ERROR` on Android:
1. Generate an APK using `eas build`.
2. Run `eas credentials` to retrieve your Android Keystore's **SHA-1 Fingerprint**.
3. Go to Google Cloud Console > Credentials.
4. Create an **Android OAuth Client ID** using your package name (`com.anonymous.Del_Road`) and the SHA-1 Fingerprint.

## 📄 License

This project is licensed under the MIT License.
