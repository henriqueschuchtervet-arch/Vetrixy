# Integração incremental Nexus — estado verificável

## Entregue nesta branch
- Prévia independente da Central de Documentos em `modules/nexus-documentos.html`.
- Botão SNCR visível e desabilitado; sem números simulados.
- Campos demonstrativos para documento de exame físico anterior, sem armazenamento.
- Entradas GTA e CVI (certificado veterinário internacional) apenas informativas, sem falsa emissão oficial.
- Área reservada para feed profissional; não implementa o arquivo do Claude.

## Não concluído
- Integração real com SNCR: depende de credenciamento, requisitos oficiais e habilitação veterinária.
- Integração de anexos clínicos: exige Storage privado, RLS, antivírus, consentimento/base legal e trilha de auditoria.
- GTA e CVI: não são emitidos automaticamente pelo Nexus; dependem de fluxos oficiais do MAPA e/ou órgão estadual competente.
- Feed: localizar o arquivo original do Claude, revisar dependências, autorização de casos, anonimização, segurança e só então integrar.
- Conexão com o dashboard existente e deploy: ainda não executados, para preservar login, receitas e prontuários atuais.

## Critérios de aceite
1. Identificar a versão exata em produção no Netlify; criar preview.
2. Preservar autenticação, Supabase e RLS; executar testes com dois perfis.
3. Anexos: somente usuários autorizados, tamanho/tipo limitados, storage privado, auditoria, sem URL pública.
4. Feed: nenhum dado identificável de tutor/paciente sem base legal e autorização apropriada.
5. Documentos oficiais: separar rascunho interno de emissão validada pelo órgão competente.
6. Publicar somente após revisão e testes manuais em desktop e celular.
