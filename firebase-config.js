/*
 * DOMYŚLNIE: tryb demonstracyjny (dane zapisywane tylko w tej przeglądarce).
 *
 * Aby uruchomić wspólną synchronizację na dwóch telefonach:
 * 1. Utwórz projekt Firebase, aplikację Web, Firestore i Authentication.
 * 2. Wstaw obiekt konfiguracji z Firebase w miejsce null.
 * 3. Podaj e-mail i UID konta Eweliny utworzonego w Firebase Authentication.
 * 4. Wklej firestore.rules do Firebase Console (i zamień ADMIN_UID).
 * 5. Opublikuj ten folder na Netlify Drop.
 *
 * Instrukcja krok po kroku: plik INSTRUKCJA.md w pobranym archiwum.
 */
window.VOUCHER_SETTINGS = {
  firebase: null,
  adminEmail: "",
  adminUid: ""
};

/*
PRZYKŁAD FORMATU (nie kopiuj przykładowych wartości):
window.VOUCHER_SETTINGS = {
  firebase: {
    apiKey: "AIza...",
    authDomain: "twoj-projekt.firebaseapp.com",
    projectId: "twoj-projekt",
    storageBucket: "twoj-projekt.firebasestorage.app",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:abcdef"
  },
  adminEmail: "ewelina@example.com",
  adminUid: "UID_Z_Firebase_Authentication"
};
*/
