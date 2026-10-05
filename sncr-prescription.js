(() => {
  'use strict';

  // Adapter isolado do receituário comum. Nenhuma escrita em banco é feita aqui.
  const SNCR_FUNCTION = 'vetrixy-sncr';

  function sbClient() { return typeof sb !== 'undefined' ? sb : null; }
  function value(id) { return document.getElementById(id)?.value?.trim() || ''; }

  window.openSpecialPrescription = function openSpecialPrescription() {
    const modal = document.getElementById('modal-receita-especial');
    if (!modal) return;
    modal.classList.add('open');
  };

  window.closeSpecialPrescription = function closeSpecialPrescription() {
    const modal = document.getElementById('modal-receita-especial');
    if (!modal) return;
    modal.classList.remove('open');
  };

  window.submitSpecialPrescription = async function submitSpecialPrescription() {
    const client = sbClient();
    if (!client) return alert('Serviço indisponível no momento.');

    const payload = {
      patient: {
        name: value('sncr-pet'),
        species: value('sncr-especie'),
        info: value('sncr-info')
      },
      tutor: {
        name: value('sncr-tutor'),
        cpf: value('sncr-cpf')
      },
      prescription: {
        type: value('sncr-tipo'),
        medication: value('sncr-medicamento'),
        dosage: value('sncr-dose'),
        directions: value('sncr-instrucoes')
      }
    };

    if (!payload.patient.name || !payload.tutor.name || !payload.prescription.medication) {
      return alert('Preencha paciente, tutor e medicamento.');
    }

    const button = document.getElementById('sncr-submit');
    if (button) { button.disabled = true; button.textContent = 'VALIDANDO…'; }

    try {
      const { data, error } = await client.functions.invoke(SNCR_FUNCTION, { body: payload });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Não foi possível processar o receituário especial.');
      // O backend oficial será responsável por número/QR/assinatura e documento final.
      if (data.document_url) window.open(data.document_url, '_blank', 'noopener,noreferrer');
      closeSpecialPrescription();
    } catch (error) {
      console.error('[Vetrixy SNCR]', error);
      alert('Receituário especial ainda não disponível. Nenhuma receita comum foi alterada.');
    } finally {
      if (button) { button.disabled = false; button.textContent = 'VALIDAR E EMITIR'; }
    }
  };
})();