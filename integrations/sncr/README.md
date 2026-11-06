# SNCR — preparação de integração (NÃO habilitada)
Este módulo é um contrato interno de preparação, **não uma integração homologada com a Anvisa**.
A emissão de notificações/receitas controladas fica proibida até confirmação documental da habilitação de médicos-veterinários, das credenciais de produção e dos requisitos oficiais.

## Regras de segurança
- Nunca gerar, simular como válido, ou inventar número oficial SNCR.
- Nunca marcar uma prescrição como emitida pela Anvisa sem resposta autenticada do serviço oficial.
- Não expor chaves, certificados ou tokens no navegador, GitHub ou PDF.
- Assinatura Gov.br e QR para validar.iti.gov.br não substituem automaticamente a modalidade de assinatura exigida para controlados.
- Validar as regras de telemedicina veterinária e a classificação do medicamento antes de habilitar qualquer fluxo.

## Arquitetura proposta
Nexus (frontend) -> Supabase Edge Function autenticada -> adaptador SNCR (desativado) -> API oficial (somente após credenciamento).
Persistir trilha de auditoria, idempotência e estados de solicitação, com RLS por prescritor.

## Critérios de desbloqueio
1. Confirmar por fonte oficial se médicos-veterinários podem emitir eletronicamente a categoria específica.
2. Confirmar credenciamento da plataforma, eventual exigência de CNPJ e custo.
3. Obter especificação atualizada, credenciais de homologação e autorização de uso.
4. Validar certificados e formato de assinatura.
5. Executar testes documentados, incluindo rejeições, revogações e duplicidade.
6. Aprovação regulatória e técnica explícita antes do deploy em produção.

## Situação
Nenhuma chamada real à Anvisa está implementada neste arquivo. O site e o Nexus existentes não são alterados por esta preparação.
