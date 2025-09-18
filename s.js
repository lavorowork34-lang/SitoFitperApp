/* Assistenza — script pagina
   Richiede gli helper globali di script.js (qs, qsa)
   Include: FAQ accordion, modali, toast, chat IA (Gemini via fetch API)
*/

// ---- Toast helper
const toastEl = document.getElementById('toast');
function showToast(msg, t = 2200) {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), t);
}

// ---- Modal helpers
const modal = document.getElementById('contact-modal');
function openModal() { modal?.setAttribute('aria-hidden', 'false'); }
function closeModal() { modal?.setAttribute('aria-hidden', 'true'); }

qs('#open-contact')?.addEventListener('click', openModal);
qs('#open-contact-2')?.addEventListener('click', openModal);
qsa('[data-close="modal"]').forEach(b => b.addEventListener('click', closeModal));
modal?.querySelector('.modal__overlay')?.addEventListener('click', closeModal);

// Fake submit contatti
qs('#contact-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  console.log('Contact form:', data);
  closeModal();
  showToast('Messaggio inviato. Ti risponderemo presto!');
});

// ---- FAQ accordion
qsa('.faq__item').forEach(item => {
  const btn = item.querySelector('.faq__q');
  btn?.addEventListener('click', () => {
    const expanded = item.getAttribute('aria-expanded') === 'true';
    item.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  });
});

// ---- Chat IA (Gemini) UI
const aiRoot = document.getElementById('ai-chat');
const aiWindow = aiRoot?.querySelector('.ai-chat__window');
const fab = document.getElementById('ai-fab');
const aiClose = document.getElementById('ai-close');
const aiMinimize = document.getElementById('ai-minimize');
const settingsBtn = document.getElementById('ai-settings');
const settingsPanel = document.getElementById('ai-settings-panel');
const keyInput = document.getElementById('gemini-key');
const saveKeyBtn = document.getElementById('save-key');
const statusDot = document.getElementById('ai-status');
const aiForm = document.getElementById('ai-form');
const aiText = document.getElementById('ai-text');
const aiLog = document.getElementById('ai-log');

const GEMINI_KEY_STORAGE = '600931583751-23csi8pajv0ju4alhu7798vnfrhfeilt.apps.googleusercontent.com';
const GEMINI_MODEL = 'gemini-1.5-flash'; // veloce e adeguato per QA

// Stato iniziale key
(function initKey() {
  const key = localStorage.getItem(GEMINI_KEY_STORAGE);
  if (key && keyInput) keyInput.value = key;
  setStatus(!!key);
})();

function setStatus(ready) {
  if (!statusDot) return;
  statusDot.style.background = ready ? 'var(--accent)' : 'var(--danger)';
}

function toggleAI(open) {
  if (!aiRoot) return;
  if (open === undefined) open = !aiRoot.classList.contains('open');
  aiRoot.classList.toggle('open', open);
}

qs('#open-ai-chat')?.addEventListener('click', () => toggleAI(true));
qs('#open-ai-chat-2')?.addEventListener('click', () => toggleAI(true));
fab?.addEventListener('click', () => toggleAI());
aiClose?.addEventListener('click', () => toggleAI(false));
aiMinimize?.addEventListener('click', () => aiWindow?.classList.toggle('min'));

settingsBtn?.addEventListener('click', () => {
  const hidden = settingsPanel?.hasAttribute('hidden');
  if (!settingsPanel) return;
  if (hidden) settingsPanel.removeAttribute('hidden');
  else settingsPanel.setAttribute('hidden', '');
});

saveKeyBtn?.addEventListener('click', () => {
  const val = keyInput?.value?.trim();
  if (!val) { showToast('Inserisci una API key valida'); return; }
  localStorage.setItem(GEMINI_KEY_STORAGE, val);
  setStatus(true);
  showToast('API key salvata localmente');
});

// ---- Gemini call (fetch)
async function geminiComplete(userText) {
  const apiKey = localStorage.getItem(GEMINI_KEY_STORAGE);
  if (!apiKey) throw new Error('Manca la API key Gemini');

  // API REST: Generative Language API v1beta (text-only)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ role: 'user', parts: [{ text: userText }]}]
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Errore API (${res.status}): ${t}`);
  }
  const data = await res.json();
  // Estrarre il testo dalla prima candidate
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Nessuna risposta disponibile.';
  return text;
}

// ---- Chat log helpers
function appendMsg(role, text) {
  if (!aiLog) return;
  const el = document.createElement('div');
  el.className = `msg msg--${role}`;
  el.innerHTML = `<div class="msg__role">${role === 'user' ? 'Tu' : 'Fitapp AI'}</div><div class="msg__bubble">${escapeHTML(text)}</div>`;
  aiLog.appendChild(el);
  aiLog.scrollTop = aiLog.scrollHeight;
}

function escapeHTML(str) {
  return str.replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[s]));
}

aiForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = aiText?.value?.trim();
  if (!text) return;
  aiText.value = '';
  appendMsg('user', text);
  try {
    appendMsg('assistant', 'Sto pensando…');
    const reply = await geminiComplete(text);
    // sostituisci l'ultimo placeholder "Sto pensando…"
    const last = aiLog?.lastElementChild;
    if (last && last.querySelector('.msg__bubble')?.textContent === 'Sto pensando…') {
      last.querySelector('.msg__bubble').textContent = reply;
    } else {
      appendMsg('assistant', reply);
    }
  } catch (err) {
    console.error(err);
    showToast(err.message || 'Errore nella chiamata a Gemini');
    appendMsg('assistant', 'Si è verificato un errore. Verifica la tua API key e la connessione.');
  }
});