# Comprovante de atendimento presencial prévio

Implementar no Nexus, vinculado a paciente, tutor e veterinário, um registro de atendimento presencial anterior: data/hora, local, profissional/CRMV/UF, identificação do animal, achados clínicos, documento anexado, assinatura quando aplicável e origem verificável. Armazenar arquivo em bucket privado com RLS, limite de formato/tamanho e trilha de auditoria. Registrar a data de início da relação veterinário-animal-responsável, quando comprovada, e verificar as condições da Resolução CFMV 1465/2022 e normas vigentes para teleconsulta. Não tratar simples upload como autorização automática. Exibir aviso e bloquear a modalidade teleconsulta quando requisitos não estiverem comprovados; permitir apenas modalidades legalmente cabíveis.

SNCR: não gerar numeração ou receita controlada oficial sem autorização e integração homologada. GTA/CVI: anexos e rascunhos não substituem documentos oficiais emitidos pelas autoridades competentes.
