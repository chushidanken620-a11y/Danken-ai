const $ = (id) => document.getElementById(id);
const STORAGE_KEY = 'danken-ai-chats-v1';
let chats = readChats();
let activeChatId = null;
let busy = false;
let toastTimer;

function readChats() { try { const v = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } }
function saveChats() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(chats.slice(0, 30))); } catch { showToast('Browser storage is full. Your current chat still works.'); } }
function makeId() { return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function activeChat() { return chats.find(c => c.id === activeChatId); }
function newChat() { activeChatId = null; $('messages').replaceChildren(); $('messages').hidden = true; $('welcome').hidden = false; $('promptInput').value = ''; updateCounter(); renderHistory(); $('promptInput').focus(); closeSidebar(); }
function ensureChat() { let chat = activeChat(); if (!chat) { chat = { id: makeId(), title: 'New conversation', messages: [], updatedAt: Date.now() }; chats.unshift(chat); activeChatId = chat.id; } return chat; }
function renderHistory() {
  const list = $('historyList'); list.replaceChildren();
  if (!chats.length) { const empty = document.createElement('div'); empty.className = 'history-empty'; empty.textContent = 'Your conversations will appear here.'; list.append(empty); return; }
  chats.slice().sort((a,b) => b.updatedAt-a.updatedAt).forEach(chat => {
    const b = document.createElement('button'); b.className = 'history-item' + (chat.id === activeChatId ? ' selected' : ''); b.type = 'button';
    const icon = document.createElement('span'); icon.textContent = '◷'; icon.style.color = '#9c8af5';
    const label = document.createElement('span'); label.textContent = chat.title || 'Conversation'; b.append(icon, label); b.title = chat.title || 'Conversation'; b.addEventListener('click', () => loadChat(chat.id)); list.append(b);
  });
}
function loadChat(id) { const chat = chats.find(c => c.id === id); if (!chat) return; activeChatId = id; $('welcome').hidden = true; $('messages').hidden = false; $('messages').replaceChildren(); chat.messages.forEach(m => addMessage(m.role, m.content, false)); renderHistory(); closeSidebar(); scrollToBottom(); }
function addMessage(role, content, actions = true) {
  const container = document.createElement('article'); container.className = `message ${role}`;
  const avatar = document.createElement('div'); avatar.className = 'message-avatar'; avatar.textContent = role === 'assistant' ? 'D' : 'Y';
  const body = document.createElement('div'); body.className = 'message-body';
  if (role === 'assistant') { const name = document.createElement('div'); name.className = 'message-name'; name.textContent = 'Danken AI'; body.append(name); }
  const text = document.createElement('div'); text.className = 'message-text'; text.textContent = content; body.append(text);
  if (role === 'assistant' && actions) { const actionRow = document.createElement('div'); actionRow.className = 'message-actions'; const copy = document.createElement('button'); copy.className = 'message-action'; copy.textContent = 'Copy response'; copy.addEventListener('click', async () => { try { await navigator.clipboard.writeText(content); showToast('Response copied'); } catch { showToast('Could not copy automatically on this browser.'); } }); actionRow.append(copy); body.append(actionRow); }
  container.append(avatar, body); $('messages').append(container); return container;
}
function showTyping() { const el = document.createElement('article'); el.className = 'message'; el.id = 'typingIndicator'; const avatar = document.createElement('div'); avatar.className = 'message-avatar'; avatar.textContent = 'D'; const body = document.createElement('div'); body.className = 'message-body'; const name = document.createElement('div'); name.className = 'message-name'; name.textContent = 'Danken AI is thinking'; const dots = document.createElement('div'); dots.className = 'typing'; for (let i=0;i<3;i++) dots.append(document.createElement('span')); body.append(name,dots); el.append(avatar,body); $('messages').append(el); scrollToBottom(); }
function scrollToBottom() { requestAnimationFrame(() => { $('chatArea').scrollTop = $('chatArea').scrollHeight; }); }
function showToast(message) { const t = $('toast'); t.textContent = message; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600); }
function updateCounter() { $('charCount').textContent = `${$('promptInput').value.length} / 8000`; }
function closeSidebar() { $('sidebar').classList.remove('open'); $('scrim').classList.remove('show'); }
async function sendMessage(text) {
  text = text.trim(); if (!text || busy) return;
  const chat = ensureChat(); chat.messages.push({ role: 'user', content: text }); chat.updatedAt = Date.now();
  if (chat.messages.filter(m => m.role === 'user').length === 1) chat.title = text.length > 36 ? text.slice(0, 36).trim() + '…' : text;
  $('welcome').hidden = true; $('messages').hidden = false; addMessage('user', text, false); saveChats(); renderHistory();
  $('promptInput').value = ''; updateCounter(); $('promptInput').style.height = 'auto'; busy = true; $('sendButton').disabled = true; showTyping();
  try {
    const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: chat.messages.slice(-20) }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
    const answer = typeof data.answer === 'string' ? data.answer : '';
    if (!answer) throw new Error('The AI returned an empty answer. Please try again.');
    $('typingIndicator')?.remove(); chat.messages.push({ role: 'assistant', content: answer }); chat.updatedAt = Date.now(); saveChats(); addMessage('assistant', answer); renderHistory();
  } catch (error) {
    $('typingIndicator')?.remove(); const msg = error.message || 'Something went wrong.'; addMessage('assistant', `Sorry — ${msg}\n\nYour message is still here. You can try again in a moment.`, true); showToast(msg);
  } finally { busy = false; $('sendButton').disabled = false; $('promptInput').focus(); scrollToBottom(); }
}
$('chatForm').addEventListener('submit', e => { e.preventDefault(); sendMessage($('promptInput').value); });
$('promptInput').addEventListener('input', () => { updateCounter(); const el = $('promptInput'); el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight,160)}px`; });
$('promptInput').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('chatForm').requestSubmit(); } });
document.querySelectorAll('[data-prompt]').forEach(button => button.addEventListener('click', () => { $('promptInput').value = button.dataset.prompt; updateCounter(); $('promptInput').focus(); $('promptInput').style.height = 'auto'; $('promptInput').style.height = `${$('promptInput').scrollHeight}px`; }));
$('newChat').addEventListener('click', newChat); $('homeLink').addEventListener('click', newChat);
$('clearHistory').addEventListener('click', () => { if (!chats.length) return; if (confirm('Delete all saved conversations from this browser?')) { chats = []; activeChatId = null; saveChats(); newChat(); showToast('Local chat history cleared'); } });
$('openSidebar').addEventListener('click', () => { $('sidebar').classList.add('open'); $('scrim').classList.add('show'); }); $('closeSidebar').addEventListener('click', closeSidebar); $('scrim').addEventListener('click', closeSidebar);
$('aboutButton').addEventListener('click', () => $('aboutDialog').showModal()); $('closeAbout').addEventListener('click', () => $('aboutDialog').close()); $('aboutOk').addEventListener('click', () => $('aboutDialog').close());
$('shareButton').addEventListener('click', async () => { try { if (navigator.share) await navigator.share({ title: 'Danken AI', text: 'Meet Danken AI — your assistant for questions, ideas, learning, and getting things done.', url: location.href }); else { await navigator.clipboard.writeText(location.href); showToast('Website link copied'); } } catch (e) { if (e?.name !== 'AbortError') showToast('Sharing is not available here yet.'); } });
document.addEventListener('keydown', e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); newChat(); } if (e.key === 'Escape') closeSidebar(); });
async function checkStatus() { try { const r = await fetch('/api/status'); const s = await r.json(); $('connectionLabel').textContent = s.ready ? `Connected · ${s.provider}` : 'AI setup needed'; $('connectionLabel').style.color = s.ready ? '#9b91c6' : '#d8a87d'; } catch { $('connectionLabel').textContent = 'Server unavailable'; } }
renderHistory(); checkStatus();
if (chats.length) { const latest = chats.slice().sort((a,b)=>b.updatedAt-a.updatedAt)[0]; if (latest?.messages?.length) loadChat(latest.id); }
