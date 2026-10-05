(() => {
  'use strict';

  const SNCR_API = 'https://sncr-api.apps.anvisa.gov.br';
  const TOKEN_KEY = 'vetrixy_sncr_access_token';

  function el(id){ return document.getElementById(id); }
  function setStatus(status, detail){
    const badge=el('sncr-credential-status'), info=el('sncr-credential-detail');
    if(badge) badge.textContent = status || 'NÃO CONECTADO';
    if(info) info.textContent = detail || 'Conexão individual com o SNCR.';
  }
  function token(){ return sessionStorage.getItem(TOKEN_KEY) || ''; }
  function tokenValid(value){
    if(!value) return false;
    try {
      const part=value.split('.')[1];
      if(!part) return false;
      const normalized=part.replace(/-/g,'+').replace(/_/g,'/');
      const payload=JSON.parse(atob(normalized));
      return Number(payload.exp || 0) * 1000 > Date.now();
    } catch { return false; }
  }
  function callbackUrl(){
    const url=new URL(window.location.href);
    url.searchParams.delete('session_id');
    url.hash='';
    return url.toString();
  }
  function cleanCallback(){
    const url=new URL(window.location.href);
    url.searchParams.delete('session_id');
    window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
  }

  window.loadSncrCredentialStatus = function(){
    if(tokenValid(token())) {
      setStatus('CONECTADO','Sessão SNCR ativa para este navegador.');
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
      setStatus('NÃO CONECTADO','Conecte sua conta individual do SNCR para usar o receituário eletrônico oficial.');
    }
  };

  window.startSncrCredential = function(){
    const clientUrl=callbackUrl();
    window.location.href = SNCR_API + '/api/v1/auth/login?client_url=' + encodeURIComponent(clientUrl);
  };

  async function processSncrCallback(){
    const sessionId=new URLSearchParams(window.location.search).get('session_id');
    if(!sessionId) return;
    setStatus('CONECTANDO','Validando retorno do SNCR…');
    try {
      const response=await fetch(SNCR_API + '/api/v1/auth/token?session_id=' + encodeURIComponent(sessionId));
      if(!response.ok) throw new Error('Falha ao trocar sessão SNCR por token.');
      const data=await response.json();
      if(!data?.access_token) throw new Error('Token SNCR ausente.');
      sessionStorage.setItem(TOKEN_KEY,data.access_token);
      cleanCallback();
      setStatus('CONECTADO','SNCR conectado com sucesso para esta sessão.');
    } catch(error) {
      console.error('[Vetrixy SNCR auth]',error);
      sessionStorage.removeItem(TOKEN_KEY);
      cleanCallback();
      setStatus('NÃO CONECTADO','Não foi possível concluir a conexão com o SNCR.');
    }
  }

  window.getSncrAccessToken = function(){
    const value=token();
    if(!tokenValid(value)) {
      sessionStorage.removeItem(TOKEN_KEY);
      return '';
    }
    return value;
  };

  window.disconnectSncr = function(){
    sessionStorage.removeItem(TOKEN_KEY);
    loadSncrCredentialStatus();
  };

  document.addEventListener('DOMContentLoaded',async()=>{
    if(!el('sncr-credential-status')) return;
    await processSncrCallback();
    loadSncrCredentialStatus();
  });
})();
