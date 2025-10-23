# Native iOS/Android Setup

Your app is now configured for native mobile deployment using Capacitor!

## Local Development Setup

To test on physical devices or emulators:

### 1. Export and Clone Repository
- Click "Export to Github" in Lovable
- Clone your repository locally: `git clone <your-repo-url>`
- Navigate to project: `cd trail-blaze-track`

### 2. Install Dependencies
```bash
npm install
```

### 3. Add Native Platforms
```bash
# Add iOS (requires Mac with Xcode)
npx cap add ios

# Add Android (requires Android Studio)
npx cap add android
```

### 4. Update Native Dependencies
```bash
# For iOS
npx cap update ios

# For Android
npx cap update android
```

### 5. Build and Sync
```bash
npm run build
npx cap sync
```

### 6. Run on Device/Emulator
```bash
# iOS (Mac with Xcode required)
npx cap run ios

# Android (Android Studio required)
npx cap run android
```

## Hot Reload During Development

The app is configured to connect to your Lovable sandbox for development:
- URL: `https://b41bf882-e17a-40f1-b0a0-256bb321e561.lovableproject.com`
- Make changes in Lovable and they'll reflect immediately in your native app
- No rebuild needed during development!

## Production Build

For production deployment:

1. Update `capacitor.config.ts` and remove the `server` section
2. Build the app: `npm run build`
3. Sync: `npx cap sync`
4. Open in native IDE:
   - iOS: `npx cap open ios` (publish via Xcode)
   - Android: `npx cap open android` (publish via Android Studio)

## Requirements

- **iOS**: Mac with Xcode installed
- **Android**: Android Studio installed (works on Windows/Mac/Linux)
- **Both platforms**: Node.js and npm

## App Store Publishing

- **Free to develop**: All Capacitor tools are free
- **App Store fees**: 
  - Apple: $99/year for developer account
  - Google Play: $25 one-time fee

## Learn More

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS Setup Guide](https://capacitorjs.com/docs/ios)
- [Android Setup Guide](https://capacitorjs.com/docs/android)
