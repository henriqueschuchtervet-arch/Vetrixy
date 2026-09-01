(() => {
  'use strict';

  const state = { conversationId: null, messages: [], busy: false, initialized: false };

  function el(id) { return document.getElementById(id); }
  function uid() { return window.vetData?.user_id || (typeof vetData !== 'undefined' ? vetData.user_id : null); }
  function client() { return typeof sb !== 'undefined' ? sb : null; }

  window.initAiCopilot = async function initAiCopilot() {
    if (!uid() || !client()) return;
    syncPatientOptions();
    if (!state.initialized) {
      state.initialized = true;
      el('ai-input')?.addEventListener('keydown', event => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          sendAiMessage();
        }
      });
    }
    await loadAiConversations();
  };

  function syncPatientOptions() {
    const select = el('ai-patient');
    if (!select) return;
    const current = select.value;
    const patients = typeof allPacientes !== 'undefined' ? allPacientes : [];
    select.innerHTML = '<option value="">Consulta geral (sem paciente)</option>' + patients.map(p =>
      `<option value="${escapeHtml(p.id)}">${escapeHtml(p.nome || 'Sem nome')} · ${escapeHtml(p.especie || 'Espécie não informada')}</option>`
    ).join('');
    if ([...select.options].some(o => o.value === current)) select.value = current;
  }

  async function loadAiConversations() {
    const { data, error } = await client().from('ia_conversas')
      .select('id,titulo,paciente_id,updated_at')
      .eq('vet_id', uid()).order('updated_at', { ascending: false }).limit(30);
    if (error) { showAiError(friendlyError(error)); return; }
    renderAiHistory(data || []);
  }

  function renderAiHistory(items) {
    const list = el('ai-history-list');
    if (!list) return;
    if (!items.length) {
      list.innerHTML = '<div class="empty" style="padding:22px 8px"><p>Nenhuma conversa ainda</p></div>';
      return;
    }
    list.innerHTML = items.map(item => `<button class="ai-history-item ${item.id === state.conversationId ? 'active' : ''}" onclick="openAiConversation('${item.id}')"><strong>${escapeHtml(item.titulo || 'Nova consulta')}</strong><small>${formatAiDate(item.updated_at)}</small></button>`).join('');
  }

  window.newAiConversation = function newAiConversation() {
    state.conversationId = null;
    state.messages = [];
    el('ai-patient').value = '';
    renderAiMessages();
    document.querySelectorAll('.ai-history-item').forEach(item => item.classList.remove('active'));
    el('ai-input')?.focus();
  };

  window.openAiConversation = async function openAiConversation(id) {
    if (state.busy) return;
    clearAiError();
    const { data: conversation, error: convError } = await client().from('ia_conversas')
      .select('id,paciente_id').eq('id', id).eq('vet_id', uid()).single();
    if (convError) { showAiError(friendlyError(convError)); return; }
    const { data, error } = await client().from('ia_mensagens')
      .select('id,papel,conteudo,created_at').eq('conversa_id', id).eq('vet_id', uid()).order('created_at');
    if (error) { showAiError(friendlyError(error)); return; }
    state.conversationId = id;
    state.messages = (data || []).map(m => ({ id: m.id, role: m.papel, content: m.conteudo }));
    el('ai-patient').value = conversation.paciente_id || '';
    renderAiMessages();
    await loadAiConversations();
  };

  window.useAiPrompt = function useAiPrompt(text) {
    const input = el('ai-input');
    input.value = text;
    input.focus();
  };

  window.sendAiMessage = async function sendAiMessage() {
    if (state.busy) return;
    const input = el('ai-input');
    const content = input.value.trim();
    if (!content) return;
    if (content.length > 4000) { showAiError('A mensagem deve ter no máximo 4.000 caracteres.'); return; }
    clearAiError();
    state.busy = true;
    setAiBusy(true);
    input.value = '';

    try {
      if (!state.conversationId) await createAiConversation(content);
      await saveAiMessage('user', content);
      state.messages.push({ role: 'user', content });
      renderAiMessages(true);

      const recentMessages = state.messages.slice(-12).map(({ role, content: messageContent }) => ({ role, content: messageContent }));
      const { data, error } = await client().functions.invoke('vetrixy-ai', {
        body: { messages: recentMessages, patient_id: el('ai-patient').value || null }
      });
      if (error) throw error;
      if (!data?.answer) throw new Error(data?.error || 'Resposta vazia do copiloto.');

      await saveAiMessage('assistant', data.answer);
      state.messages.push({ role: 'assistant', content: data.answer });
      renderAiMessages();
      await client().from('ia_conversas').update({ updated_at: new Date().toISOString() }).eq('id', state.conversationId).eq('vet_id', uid());
      await loadAiConversations();
    } catch (error) {
      showAiError(friendlyError(error));
      renderAiMessages();
    } finally {
      state.busy = false;
      setAiBusy(false);
      input.focus();
    }
  };

  async function createAiConversation(firstMessage) {
    const title = firstMessage.replace(/\s+/g, ' ').slice(0, 70) || 'Nova consulta';
    const patientId = el('ai-patient').value || null;
    const { data, error } = await client().from('ia_conversas').insert({ vet_id: uid(), paciente_id: patientId, titulo: title }).select('id').single();
    if (error) throw error;
    state.conversationId = data.id;
  }

  async function saveAiMessage(role, content) {
    const { error } = await client().from('ia_mensagens').insert({ conversa_id: state.conversationId, vet_id: uid(), papel: role, conteudo: content });
    if (error) throw error;
  }

  function renderAiMessages(showTyping = false) {
    const box = el('ai-messages');
    if (!box) return;
    if (!state.messages.length && !showTyping) {
      box.innerHTML = '<div class="ai-welcome"><div class="ai-welcome-icon">✦</div><strong>COPILOTO CLÍNICO VETRIXY</strong><p>Use para organizar hipóteses, triagem, exames e comunicação clínica. Selecione um paciente apenas quando o contexto dele for necessário.</p></div>';
      return;
    }
    box.innerHTML = state.messages.map((message, index) => `<div class="ai-message ${message.role === 'user' ? 'user' : 'assistant'}">${escapeHtml(message.content)}${message.role === 'assistant' ? `<button class="ai-copy" onclick="copyAiMessage(${index})">COPIAR RESPOSTA</button>` : ''}</div>`).join('') + (showTyping ? '<div class="ai-message assistant ai-typing">Analisando o caso com cautela…</div>' : '');
    box.scrollTop = box.scrollHeight;
  }

  window.copyAiMessage = async function copyAiMessage(index) {
    const content = state.messages[index]?.content;
    if (!content) return;
    try { await navigator.clipboard.writeText(content); }
    catch { showAiError('Não foi possível copiar automaticamente. Selecione o texto e copie manualmente.'); }
  };

  function setAiBusy(busy) {
    const button = el('ai-send');
    const input = el('ai-input');
    if (button) { button.disabled = busy; button.textContent = busy ? 'ANALISANDO…' : 'ENVIAR'; }
    if (input) input.disabled = busy;
  }

  function showAiError(message) {
    const error = el('ai-error');
    if (!error) return;
    error.textContent = message;
    error.hidden = false;
  }
  function clearAiError() { const error = el('ai-error'); if (error) error.hidden = true; }
  function friendlyError(error) {
    const message = error?.message || String(error || 'Erro inesperado.');
    if (/Failed to send|FunctionsHttpError|non-2xx/i.test(message)) return 'O copiloto não conseguiu responder agora. Tente novamente em instantes.';
    if (/relation .* does not exist|ia_conversas|ia_mensagens/i.test(message)) return 'O histórico do copiloto ainda não foi ativado no servidor.';
    return message;
  }
  function formatAiDate(value) {
    if (!value) return '';
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
  }
})();
