# daily-newsletters-app

Creato il 2026-11-16

## Scopo
App mobile (web + Android + iOS) che mostra ogni giorno 10 notizie tech/AI, 10 tool da provare e la sezione "Fuori scaffale" (attualità, tendenze, curiosità), ricavate dalle newsletter di Luca.

## Stack
- `docs/`: app web in HTML/CSS/JS puro (nessuna build). È anche la cartella servita da GitHub Pages.
- `docs/data/latest.json`: edizione del giorno, l'unico file che cambia ogni giorno.
- Capacitor 8: `android/` e `ios/` impacchettano `docs/` come app native.
- `scripts/validate-data.mjs`: pulizia e controllo privacy dei dati. `scripts/publish.sh`: pubblicazione.

## Come si lancia
```
python3 -m http.server 4173 --directory docs
```
Pubblicare l'edizione del giorno:
```
./scripts/publish.sh
```
Ricompilare l'APK dopo modifiche alla grafica:
```
export JAVA_HOME=/opt/homebrew/opt/openjdk@21 ANDROID_HOME=/opt/homebrew/share/android-commandlinetools && npx cap sync && cd android && ./gradlew assembleDebug
```

## Regole del progetto
- Rispondi in italiano.
- Non toccare file fuori da questa cartella.
- Soluzioni semplici, in locale, senza Docker né server complessi.
- Privacy: nei dati e nel codice non devono mai comparire indirizzi email, ID di messaggi, nomi delle caselle o link a Gmail. Solo link pubblici al sito originale; se manca, `url` resta `null`.
- Il repository è pubblico: i commit usano l'indirizzo noreply di GitHub, non l'email personale.
- Colori: palette dell'artifact Daily Newsletters (variabili in `docs/styles.css`). Font: Inter.

## Da non toccare
- `docs/config.js` (indirizzo da cui le app native scaricano i dati), salvo cambio di hosting.

## Stato attuale
App pubblicata su GitHub Pages, APK di debug compilato, progetto iOS pronto per Xcode. Routine quotidiana in Claude Code (task schedulato `daily-newsletters-app`).
