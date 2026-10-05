(() => {
  'use strict';
  const FN = 'vetrixy-sncr';

  function client(){ return typeof sb !== 'undefined' ? sb : null; }
  function el(id){ return document.getElementById(id); }
  function setStatus(status, detail){
    const badge=el('sncr-credential-status'), info=el('sncr-credential-detail');
    if(badge) badge.textContent = status || 'NÃO CONFIGURADO';
    if(info) info.textContent = detail || 'Credenciamento individual vinculado ao profissional autenticado.';
  }

  async function invoke(action, extra={}) {
    const c=client();
    if(!c) throw new Error('Serviço indisponível.');
    const { data, error } = await c.functions.invoke(FN,{body:{action,...extra}});
    if(error) throw error;
    return data || {};
  }

  window.loadSncrCredentialStatus = async function(){
    try {
      const data=await invoke('credential_status');
      setStatus(data.status || 'NÃO CONFIGURADO', data.detail);
    } catch(e) {
      console.warn('[Vetrixy SNCR credential]',e);
      setStatus('NÃO CONFIGURADO','Integração regulatória ainda não habilitada para este profissional.');
    }
  };

  window.startSncrCredential = async function(){
    const btn=el('sncr-credential-button');
    if(btn){btn.disabled=true;btn.textContent='CONECTANDO…';}
    try {
      const data=await invoke('credential_start');
      if(data.authorization_url){
        window.open(data.authorization_url,'_blank','noopener,noreferrer');
        setStatus('PENDENTE','Conclua a autorização individual no ambiente oficial e depois atualize o status.');
      } else {
        setStatus(data.status || 'PENDENTE', data.detail || 'Solicitação de credenciamento iniciada.');
      }
    } catch(e) {
      console.error('[Vetrixy SNCR credential]',e);
      alert('O credenciamento oficial ainda não está disponível. Nenhuma configuração da sua conta foi alterada.');
    } finally {
      if(btn){btn.disabled=false;btn.textContent='CREDENCIAR MEU SNCR';}
    }
  };

  document.addEventListener('DOMContentLoaded',()=>{ if(el('sncr-credential-status')) loadSncrCredentialStatus(); });
})();