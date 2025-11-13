# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Notes about editor (VS Code) errors

- If you see red squiggles for imports like `@/lesson`, run the TypeScript server restart in VS Code: open the Command Palette (Ctrl+Shift+P) → choose "TypeScript: Restart TS server". This project uses path alias `@/*` and `tsconfig.json` includes `baseUrl` so the editor should resolve imports.

Editor tips after recent fixes
- I enabled `allowJs` and `skipLibCheck` in `tsconfig.json` so the TypeScript server is less strict about the project's .js components.
- If VS Code still shows errors, open Command Palette (Ctrl+Shift+P) and run: "TypeScript: Restart TS server".

## Troubleshooting

Common issues and their solutions.

### Runtime 500 when opening the app
- If you see a 500 error after scanning the QR, try restarting Expo with cache cleared:

```cmd
cd C:\Users\Lenovo\Desktop\jura\Novalekce-main\Invigo\my-react-app\react-native-app
npx expo start -c
```

- If `npx` is blocked in PowerShell, run the command in CMD, or use `npm start -- --clear` (some npm/expo versions support this).
