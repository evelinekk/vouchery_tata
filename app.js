/* Voucher Urodzinowy – wersja bez React i bez kompilacji, gotowa na hosting statyczny. */
(() => {
  'use strict';

  const INITIAL = Object.freeze([
    {
      id: 'car-cleaning',
      title: 'Darmowe sprzątanie samochodu',
      subtitle: 'Czyszczenie wnętrza auta',
      description: 'Kompleksowe czyszczenie i odkurzanie wnętrza samochodu wykonane przeze mnie.',
      icon: 'car',
      total: 2, used: 0, pending: 0
    },
    {
      id: 'toasts',
      title: 'Zrobienie tostów',
      subtitle: 'Chrupiące i na gorąco',
      description: 'Pyszne, ciepłe tosty serwowane na życzenie o dowolnej porze.',
      icon: 'toast',
      total: 3, used: 0, pending: 0
    },
    {
      id: 'wroclaw-dinner',
      title: 'Przygotowanie jedzenia we Wrocławiu (w mieszkaniu)',
      subtitle: 'Kolacja / Posiłek na wieczór',
      description: 'Wyśmienity posiłek przygotowany przeze mnie we Wrocławiu specjalnie dla Ciebie.',
      icon: 'pin',
      total: 1, used: 0, pending: 0
    }
  ]);

  const PATHS = {
    sparkle: '<path d="m12 3 1.8 5.7L19.5 10.5l-5.7 1.8L12 18l-1.8-5.7-5.7-1.8 5.7-1.8L12 3Z"/><path d="m19.5 17 .6 1.9L22 19.5l-1.9.6-.6 1.9-.6-1.9-1.9-.6 1.9-.6.6-1.9ZM4 16l.7 2.3L7 19l-2.3.7L4 22l-.7-2.3L1 19l2.3-.7L4 16Z"/>',
    car: '<path d="m5 17-1 2v2h2v-2h12v2h2v-2l-1-2M5 17l-1-4 2-7a2 2 0 0 1 2-1h8a2 2 0 0 1 2 1l2 7-1 4H5Z"/><path d="M4 13h16M7 16h.01M17 16h.01"/>',
    toast: '<path d="M4 3v7a4 4 0 0 0 4 4v7M8 3v18M12 3v7a4 4 0 0 1-4 4M20 3c-2 3-3 6-3 10v8M20 3v18"/>',
    pin: '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    reset: '<path d="M3 11a9 9 0 1 1 2.3 6M3 3v8h8"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5M12 16h.01"/>',
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    shield: '<path d="m12 2 8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4Z"/><path d="m9 12 2 2 4-4"/>',
  };
  function icon(name, cls = '') {
    return `<svg class="svg-icon ${cls}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">${PATHS[name] || PATHS.sparkle}</svg>`;
  }
  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  const settings = window.VOUCHER_SETTINGS || { firebase: null, adminEmail: '', adminUid: '' };
  const online = Boolean(settings.firebase);
  const configComplete = !online || Boolean(
    settings.firebase.apiKey && settings.firebase.authDomain && settings.firebase.projectId &&
    settings.firebase.appId && settings.adminEmail && settings.adminUid
  );
  const STORAGE = 'vouchers_state_v3_demo_only';
  const appElement = document.getElementById('app');
  const state = {
    role: null, // tata | ewelina_login | ewelina | null
    vouchers: INITIAL.map(v => ({ ...v })),
    working: false,
    ready: !online,
    synced: !online,
    cloudInitialized: !online,
    cacheOnly: false,
    cloudError: '',
    loginError: '',
    notice: null,
    noticeTimeout: null
  };
  const cloud = { auth: null, db: null, authFns: null, storeFns: null, unsubscribe: null };

  function defaultVouchers() { return INITIAL.map(v => ({ ...v })); }
  function sanitizeCounts(value, total) {
    const used = Number.isInteger(value && value.used) ? Math.max(0, Math.min(total, value.used)) : 0;
    const pending = Number.isInteger(value && value.pending) ? Math.max(0, Math.min(total - used, value.pending)) : 0;
    return { used, pending };
  }
  function loadDemo() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE) || 'null');
      if (Array.isArray(data)) {
        state.vouchers = INITIAL.map(v => ({ ...v, ...sanitizeCounts(data.find(d => d.id === v.id), v.total) }));
      }
    } catch (error) { console.warn('Nie można odczytać localStorage.', error); }
  }
  function saveDemo() {
    try { localStorage.setItem(STORAGE, JSON.stringify(state.vouchers.map(({id, used, pending}) => ({id, used, pending})))); }
    catch (error) { console.warn('Nie można zapisać localStorage.', error); }
  }
  function notify(message, type = 'success') {
    state.notice = { message, type };
    if (state.noticeTimeout) clearTimeout(state.noticeTimeout);
    state.noticeTimeout = setTimeout(() => { state.notice = null; render(); }, 4200);
    render();
  }
  function explainError(error) {
    const code = (error && error.code) || '';
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') return 'Niepoprawne hasło lub konto Eweliny nie istnieje.';
    if (code === 'auth/too-many-requests') return 'Za dużo prób logowania. Spróbuj ponownie później.';
    if (code === 'auth/operation-not-allowed') return 'Włącz wybraną metodę logowania w Firebase Authentication.';
    if (code === 'permission-denied' || code === 'firestore/permission-denied') return 'Brak uprawnień w Firebase. Sprawdź UID Eweliny i reguły Firestore.';
    if (code === 'unavailable' || code === 'firestore/unavailable') return 'Brak połączenia z Firebase. Sprawdź internet i spróbuj ponownie.';
    return error && error.message ? error.message : 'Wystąpił błąd. Spróbuj ponownie.';
  }
  function statusMarkup() {
    if (!online) return `<span class="status-pill status-pill--warn"><span class="dot"></span>Zapis na tym urządzeniu</span>`;
    if (state.cloudError) return `<span class="status-pill status-pill--warn"><span class="dot"></span>Błąd synchronizacji</span>`;
    if (state.cacheOnly) return `<span class="status-pill status-pill--warn"><span class="dot"></span>Offline · odczyt z pamięci</span>`;
    if (!state.ready || !state.synced) return `<span class="status-pill"><span class="dot"></span>Łączenie z Firebase…</span>`;
    if (!state.cloudInitialized) return `<span class="status-pill status-pill--warn"><span class="dot"></span>Wymaga inicjalizacji przez Ewelinę</span>`;
    return `<span class="status-pill status-pill--online"><span class="dot"></span>Online · synchronizacja na żywo</span>`;
  }
  function noticeMarkup() {
    return state.notice ? `<div role="status" class="notice ${state.notice.type === 'error' ? 'notice--error' : ''}">${icon(state.notice.type === 'error' ? 'alert' : 'check', 'svg-icon--small')}<span>${escapeHTML(state.notice.message)}</span></div>` : '';
  }
  function loginScreen() {
    const login = state.role === 'ewelina_login';
    const disabled = (state.working || (online && (!state.ready || !configComplete))) ? 'disabled' : '';
    const modeMessage = !online
      ? `Witaj w aplikacji z bonami urodzinowymi! Wybierz swój profil, aby rozpocząć.`
      : state.cloudError
        ? `Nie udało się uruchomić Firebase. Sprawdź konfigurację, połączenie z internetem i odśwież stronę.`
        : !configComplete
          ? `Konfiguracja Firebase jest niepełna. Uzupełnij plik <strong>firebase-config.js</strong>.`
          : `Wspólna lista bonów jest synchronizowana między urządzeniami przez Firebase.`;
    return `<main class="login-outer"><section class="login-card" aria-label="Voucher Urodzinowy">
      <div class="login-icon">${icon('sparkle')}</div>
      <div class="eyebrow">Wyjątkowy prezent dla Ciebie</div>
      <h1 class="login-title">Voucher Urodzinowy</h1>
      <p class="login-description">${login ? 'Zaloguj się, aby zarządzać prośbami o realizację bonów.' : 'Wybierz swój profil, aby przejść do aplikacji.'}</p>
      ${!login ? `<div class="selector">
        <button type="button" class="role-btn" data-action="choose-tata" ${disabled}>
          <span class="role-icon">${icon('user', 'svg-icon--large')}</span>
          <span class="role-copy"><span class="role-name">Wejdź jako Tata</span><span class="role-subtitle">Bez hasła · Wykorzystuj swoje bony</span></span>
          <span class="role-chevron">${icon('arrow')}</span>
        </button>
        <button type="button" class="role-btn role-btn--secondary" data-action="choose-ewelina" ${disabled}>
          <span class="role-icon role-icon--purple">${icon('heart', 'svg-icon--large')}</span>
          <span class="role-copy"><span class="role-name">Ewelina</span><span class="role-subtitle">Logowanie · Zatwierdzanie prośb</span></span>
          <span class="role-chevron">${icon('lock')}</span>
        </button>
      </div>` : `<form class="login-form" id="login-form">
        <label class="field-label" for="password">Hasło Eweliny</label>
        <div class="field-wrap"><input id="password" name="password" type="password" placeholder="Wpisz hasło" required autocomplete="current-password" ${disabled}/><span class="field-icon">${icon('lock')}</span></div>
        ${state.loginError ? `<div class="form-error" role="alert">${icon('alert', 'svg-icon--small')}<span>${escapeHTML(state.loginError)}</span></div>` : ''}
        ${online && configComplete ? `<p class="role-subtitle" style="margin:11px 0 0">Konto: ${escapeHTML(settings.adminEmail)}</p>` : ''}
        <div class="form-actions">
          <button type="button" class="button button--ghost button--large" style="flex:1" data-action="back">Wstecz</button>
          <button type="submit" class="button button--primary button--large" style="flex:2" ${disabled}>${state.working ? 'Logowanie…' : 'Zaloguj się'}</button>
        </div>
      </form>`}
      ${state.cloudError ? `<div class="error-panel" role="alert">${escapeHTML(state.cloudError)}</div>` : ''}
      <div class="mode-note">${icon(online ? 'shield' : 'alert', 'svg-icon--small')}<span>${modeMessage}</span></div>
      <p class="login-footer">Z miłością i odrobiną złota ✦</p>
    </section></main>`;
  }
  function voucherCard(v) {
    const available = Math.max(0, v.total - v.used - v.pending);
    const isDone = v.used === v.total;
    const disabled = (state.working || (online && (!state.synced || !state.cloudInitialized || state.cacheOnly || !!state.cloudError))) ? 'disabled' : '';
    const dots = Array.from({ length: v.total }, (_, i) => {
      const dotClass = i < v.used ? 'progress-dot--used' : i < v.used + v.pending ? 'progress-dot--pending' : '';
      return `<span class="progress-dot ${dotClass}" aria-hidden="true"></span>`;
    }).join('');
    let actions = '';
    if (state.role === 'tata') {
      if (v.pending > 0) actions = `<span class="waiting">${icon('clock', 'svg-icon--small')}Oczekuje na akceptację${v.pending > 1 ? ` (${v.pending})` : ''}</span>`;
      else if (available > 0) actions = `<button class="button button--primary button--medium" type="button" data-action="request" data-id="${v.id}" ${disabled}>Wykorzystaj bon ${icon('arrow', 'svg-icon--small')}</button>`;
      else actions = `<span class="muted-chip">${icon('check', 'svg-icon--small')}Wszystkie wykorzystane</span>`;
    } else if (v.pending > 0) {
      actions = `<button class="button button--ghost button--small button--danger" type="button" data-action="reject" data-id="${v.id}" ${disabled}>Odrzuć</button>
      <button class="button button--primary button--small" type="button" data-action="approve" data-id="${v.id}" ${disabled}>${icon('check', 'svg-icon--small')} Zatwierdź</button>`;
    } else actions = `<span class="muted-chip">${isDone ? 'Zrealizowany w całości' : 'Brak oczekujących prośb'}</span>`;
    return `<article class="voucher-card ${v.pending ? 'voucher-card--pending' : ''} ${isDone ? 'voucher-card--done' : ''}">
      <div class="voucher-top"><span class="voucher-icon">${icon(v.icon, 'svg-icon--large')}</span><div class="voucher-details">
        <h3 class="voucher-title">${escapeHTML(v.title)}</h3><span class="voucher-subtitle">${escapeHTML(v.subtitle)}</span>
        <p class="voucher-description">${escapeHTML(v.description)}</p>
      </div></div>
      <div class="voucher-bottom"><div class="voucher-amount"><div class="progress" role="img" aria-label="Wykorzystane: ${v.used}; oczekujące: ${v.pending}; łącznie: ${v.total}">${dots}</div><span class="remaining">Pozostało: <strong>${available} z ${v.total}</strong></span></div>
      <div class="voucher-actions">${actions}</div></div>
    </article>`;
  }
  function mainScreen() {
    const isDad = state.role === 'tata';
    const totalLeft = state.vouchers.reduce((sum, v) => sum + v.total - v.used - v.pending, 0);
    const pendingCount = state.vouchers.reduce((sum, v) => sum + v.pending, 0);
    return `<main class="page">
      <header class="topbar">
        <div class="brand"><span class="brand-icon">${icon('sparkle')}</span><div><div class="brand-name">Voucher Urodzinowy</div><div class="brand-user">Zalogowano jako: <strong>${isDad ? 'Tata' : 'Ewelina'}</strong></div></div></div>
        <button class="logout" type="button" data-action="logout" title="Zmień profil">${icon('logout', 'svg-icon--small')}<span class="logout-label">Zmień profil</span></button>
      </header>
      ${noticeMarkup()}
      ${state.cloudError ? `<div class="error-panel" role="alert"><strong>Błąd Firebase:</strong> ${escapeHTML(state.cloudError)}<br/>W trybie online działania nie są zapisywane lokalnie, aby nie rozjechały się dane na telefonach.</div>` : ''}
      <section class="welcome"><div class="welcome-head">${icon('heart')} ${isDad ? 'Witaj Tato!' : 'Cześć Ewelina!'}</div>
        <p class="welcome-desc">${isDad
          ? 'Wybierz bon i kliknij „Wykorzystaj bon”. Twoja prośba pojawi się u Eweliny na tej stronie, gdzie będzie mogła ją zatwierdzić lub odrzucić.'
          : 'Tutaj możesz zatwierdzać i odrzucać prośby Taty o realizację bonów urodzinowych. Zmiany są widoczne na bieżąco.'}</p>
        <div class="status-line">${statusMarkup()}<span class="section-count">${isDad ? `Dostępnych realizacji: ${totalLeft}` : `Oczekujących prośb: ${pendingCount}`}</span></div>
      </section>
      ${online && state.synced && !state.cloudInitialized ? `<div class="info-box">Lista w chmurze nie została jeszcze utworzona. Ewelina musi zalogować się pierwszy raz, aby aktywować wszystkie trzy bony.</div>` : ''}
      <div class="section-row"><h2 class="section-title">Twoje bony ${isDad ? '🎁' : 'do zarządzania'}</h2><span class="section-count">3 prezenty</span></div>
      <section class="voucher-list" aria-label="Lista bonów">${state.vouchers.map(voucherCard).join('')}</section>
      ${!isDad ? `<div class="admin-zone"><button type="button" class="button button--ghost button--medium button--danger" data-action="reset" ${state.working || (online && (!state.synced || !state.cloudInitialized || state.cacheOnly || !!state.cloudError)) ? 'disabled' : ''}>${icon('reset', 'svg-icon--small')} Resetuj wszystkie bony do stanu początkowego</button></div>` : ''}
      <footer class="page-footer">Przygotowane specjalnie dla Taty <span class="heart">♥</span> od Eweliny</footer>
    </main>`;
  }
  function render() {
    appElement.innerHTML = !state.role || state.role === 'ewelina_login' ? loginScreen() : mainScreen();
  }
  function stopListener() {
    if (cloud.unsubscribe) { cloud.unsubscribe(); cloud.unsubscribe = null; }
  }
  function startListener() {
    stopListener();
    state.synced = false;
    state.cloudError = '';
    const { collection, onSnapshot } = cloud.storeFns;
    cloud.unsubscribe = onSnapshot(collection(cloud.db, 'birthday_vouchers'), { includeMetadataChanges: true }, snapshot => {
      const records = new Map(snapshot.docs.map(doc => [doc.id, doc.data()]));
      state.vouchers = INITIAL.map(v => ({ ...v, ...sanitizeCounts(records.get(v.id), v.total) }));
      state.cloudInitialized = INITIAL.every(v => records.has(v.id));
      state.cacheOnly = snapshot.metadata.fromCache;
      state.synced = true;
      state.cloudError = '';
      render();
    }, error => {
      state.cloudError = explainError(error);
      state.synced = false;
      render();
    });
  }
  async function initializeCloud() {
    try {
      if (!configComplete) { state.cloudError = 'Brakuje pól firebase, adminEmail lub adminUid w pliku firebase-config.js.'; render(); return; }
      const version = '12.19.0';
      const [appLib, authFns, storeFns] = await Promise.all([
        import(`https://www.gstatic.com/firebasejs/${version}/firebase-app.js`),
        import(`https://www.gstatic.com/firebasejs/${version}/firebase-auth.js`),
        import(`https://www.gstatic.com/firebasejs/${version}/firebase-firestore.js`)
      ]);
      const app = appLib.initializeApp(settings.firebase);
      cloud.auth = authFns.getAuth(app);
      cloud.db = storeFns.getFirestore(app);
      cloud.authFns = authFns;
      cloud.storeFns = storeFns;
      state.ready = true;
      render();
    } catch (error) { state.cloudError = explainError(error); render(); }
  }
  async function seedCloudAsAdmin() {
    const { doc, runTransaction } = cloud.storeFns;
    for (const v of INITIAL) {
      await runTransaction(cloud.db, async transaction => {
        const ref = doc(cloud.db, 'birthday_vouchers', v.id);
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists()) transaction.set(ref, { total: v.total, used: 0, pending: 0 });
      });
    }
  }
  async function chooseTata() {
    if (state.working || (online && !state.ready)) return;
    state.working = true;
    state.loginError = '';
    render();
    try {
      if (online) {
        await cloud.authFns.signOut(cloud.auth);
        await cloud.authFns.signInAnonymously(cloud.auth);
        startListener();
      }
      state.role = 'tata';
    } catch (error) { state.cloudError = explainError(error); notify(state.cloudError, 'error'); }
    finally { state.working = false; render(); }
  }
  async function loginEwelina(password) {
    if (state.working || (online && !state.ready)) return;
    state.working = true;
    state.loginError = '';
    render();
    try {
      if (!online) {
        if (password !== '1234') throw new Error('Nieprawidłowe hasło!');
      } else {
        const result = await cloud.authFns.signInWithEmailAndPassword(cloud.auth, settings.adminEmail, password);
        if (result.user.uid !== settings.adminUid) {
          await cloud.authFns.signOut(cloud.auth);
          throw new Error('To konto nie ma uprawnień Eweliny. Sprawdź UID w konfiguracji.');
        }
        await seedCloudAsAdmin();
        startListener();
      }
      state.role = 'ewelina';
    } catch (error) { state.loginError = explainError(error); }
    finally { state.working = false; render(); if (state.loginError) document.getElementById('password')?.focus(); }
  }
  async function logout() {
    stopListener();
    if (online && cloud.auth) {
      try { await cloud.authFns.signOut(cloud.auth); }
      catch (error) { console.warn('Wylogowanie:', error); }
    }
    state.role = null;
    state.loginError = '';
    state.cloudError = '';
    state.synced = !online;
    state.cloudInitialized = !online;
    state.cacheOnly = false;
    state.vouchers = online ? defaultVouchers() : state.vouchers;
    render();
  }
  function mutateDemo(type, id) {
    const v = state.vouchers.find(item => item.id === id);
    if (!v) throw new Error('Nie znaleziono bonu.');
    if (type === 'request') {
      if (v.used + v.pending >= v.total) throw new Error('Ten bon nie jest już dostępny.');
      v.pending += 1;
    } else if (type === 'approve') {
      if (v.pending < 1) throw new Error('Brak oczekujących prośb.');
      v.pending -= 1; v.used += 1;
    } else if (type === 'reject') {
      if (v.pending < 1) throw new Error('Brak oczekujących prośb.');
      v.pending -= 1;
    }
    saveDemo();
  }
  async function mutateCloud(type, id) {
    const { doc, runTransaction } = cloud.storeFns;
    const ref = doc(cloud.db, 'birthday_vouchers', id);
    await runTransaction(cloud.db, async transaction => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists()) throw new Error('Brak bonu w bazie. Zaloguj Ewelinę, aby zainicjować dane.');
      const current = snapshot.data();
      const total = INITIAL.find(item => item.id === id)?.total;
      const counts = sanitizeCounts(current, total);
      let update;
      if (type === 'request') {
        if (counts.used + counts.pending >= total) throw new Error('Ten bon nie jest już dostępny.');
        update = { pending: counts.pending + 1 };
      } else if (type === 'approve') {
        if (counts.pending < 1) throw new Error('Brak oczekujących prośb.');
        update = { pending: counts.pending - 1, used: counts.used + 1 };
      } else {
        if (counts.pending < 1) throw new Error('Brak oczekujących prośb.');
        update = { pending: counts.pending - 1 };
      }
      transaction.update(ref, update);
    });
  }
  async function performAction(type, id) {
    if (state.working || !INITIAL.some(v => v.id === id)) return;
    if ((type === 'request') !== (state.role === 'tata')) return;
    if (online && (!state.synced || !state.cloudInitialized || state.cacheOnly || state.cloudError)) return;
    state.working = true;
    render();
    try {
      if (online) await mutateCloud(type, id);
      else mutateDemo(type, id);
      notify({ request: 'Wysłano prośbę do Eweliny!', approve: 'Zatwierdzono wykorzystanie bonu!', reject: 'Odrzucono prośbę.' }[type]);
    } catch (error) { notify(explainError(error), 'error'); }
    finally { state.working = false; render(); }
  }
  async function resetAll() {
    if (state.role !== 'ewelina' || state.working) return;
    if (!window.confirm('Czy na pewno chcesz zresetować wszystkie bony do stanu początkowego?')) return;
    state.working = true;
    render();
    try {
      if (online) {
        const { writeBatch, doc } = cloud.storeFns;
        const batch = writeBatch(cloud.db);
        INITIAL.forEach(v => batch.set(doc(cloud.db, 'birthday_vouchers', v.id), { total: v.total, used: 0, pending: 0 }));
        await batch.commit();
      } else { state.vouchers = defaultVouchers(); saveDemo(); }
      notify('Zresetowano wszystkie bony!');
    } catch (error) { notify(explainError(error), 'error'); }
    finally { state.working = false; render(); }
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    if (action === 'choose-ewelina') { state.role = 'ewelina_login'; state.loginError = ''; render(); document.getElementById('password')?.focus(); }
    else if (action === 'choose-tata') chooseTata();
    else if (action === 'back') { state.role = null; state.loginError = ''; render(); }
    else if (action === 'logout') logout();
    else if (action === 'reset') resetAll();
    else if (['request', 'approve', 'reject'].includes(action)) performAction(action, button.dataset.id);
  });
  document.addEventListener('submit', event => {
    if (event.target.id === 'login-form') {
      event.preventDefault();
      const password = event.target.querySelector('input[name="password"]').value;
      loginEwelina(password);
    }
  });

  if (!online) loadDemo();
  render();
  if (online) initializeCloud();
})();
