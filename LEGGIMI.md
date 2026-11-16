# Daily Newsletters — app mobile

App online: https://gervox.github.io/daily-newsletters/

## Cosa c'è in questo pacchetto
- `DailyNewsletters-android.apk` — app Android già compilata, pronta da installare.
- `docs/` — l'app web (la stessa che gira al link qui sopra).
- `android/` — progetto Android (Android Studio / Gradle).
- `ios/` — progetto iOS (Xcode, Swift Package Manager: non serve CocoaPods).
- `scripts/` — controllo privacy dei dati, pubblicazione, generazione icone.

## Installare su Android
1. Copia `DailyNewsletters-android.apk` sul telefono (email a te stesso, Drive, cavo USB).
2. Aprilo dal telefono e consenti "Installa app sconosciute" quando richiesto.

È un APK di prova (firma di debug): va bene per l'installazione diretta, non per il Play Store.

## Installare su iPhone
Subito, senza Xcode: apri il link in Safari → Condividi → "Aggiungi alla schermata Home". L'app si apre a tutto schermo con la sua icona.

App nativa: serve Xcode completo (gratis dall'App Store del Mac) e il tuo Apple ID.
```bash
npm install
```
```bash
npx cap sync ios
```
```bash
npx cap open ios
```
In Xcode: seleziona il progetto App → Signing & Capabilities → scegli il tuo Team → collega l'iPhone → premi Play.
Con Apple ID gratuito l'app dura 7 giorni sul telefono; per TestFlight o App Store serve l'Apple Developer Program (99 $/anno).

## Aggiornamento quotidiano
Le notizie stanno in `docs/data/latest.json`. Ogni mattina il task schedulato di Claude Code "Daily Newsletters · edizione app" legge le newsletter, riscrive quel file e lancia:
```bash
./scripts/publish.sh
```
Le app (web, Android, iOS) scaricano l'edizione nuova da GitHub Pages a ogni apertura: non serve reinstallarle.

## Ricompilare l'APK dopo modifiche alla grafica
```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@21 ANDROID_HOME=/opt/homebrew/share/android-commandlinetools && npx cap sync android && cd android && ./gradlew assembleDebug
```
L'APK esce in `android/app/build/outputs/apk/debug/app-debug.apk`.

## Privacy
Nei dati pubblicati non ci sono indirizzi email, ID di messaggi né link a Gmail. Lo script `scripts/validate-data.mjs` blocca la pubblicazione se ne trova, e l'app stessa rifiuta di aprire link di posta o di tracciamento.
