---
description: Jak przygotować i zbudować aplikacje mobilne po migracji
---

# Budowanie Aplikacji Mobilnych (Android/iOS)

Po migracji na nową infrastrukturę `effixy.pl`, musisz wygenerować nowe wersje instalacyjne aplikacji.

## 1. Synchronizacja konfiguracji
Upewnij się, że masz zainstalowane wszystkie zależności i zsynchronizuj stan projektów natywnych:

```bash
cd frontend
npm install
npm run build 
# (Build wygeneruje folder 'out', który jest wymagany przez Capacitor)
npx cap sync
```

## 2. Budowanie wersji Android
1. Otwórz projekt w Android Studio:
   ```bash
   npx cap open android
   ```
2. W Android Studio:
   - Wykonaj **Build > Clean Project**.
   - Wygeneruj podpisany plik APK/Bundle: **Build > Generate Signed Bundle / APK...**.
   - Wybierz odpowiedni klucz (keystore), którego używałeś wcześniej.

## 3. Budowanie wersji iOS
1. Otwórz projekt w Xcode:
   ```bash
   npx cap open ios
   ```
2. W Xcode:
   - Wybierz urządzenie docelowe (Generic iOS Device).
   - Wykonaj **Product > Archive**.
   - Po zakończeniu archiwizacji wybierz **Distribute App** i postępuj zgodnie z instrukcjami App Store Connect.

## 4. Ważne zmienne
Aplikacja została skonfigurowana do łączenia się z:
- **Frontend**: https://app.effixy.pl
- **API (Backend)**: https://api.effixy.pl
- **Supabase**: https://supabase.effixy.pl
