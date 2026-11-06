# Feed original do Claude — pacote localizado e auditado (06/11/2026)

**Origem:** `VETRIXY_NEXUS_FEED_COMPLETO_20261104(1).zip` (67 entradas no arquivo, 5.257.207 bytes). Esta é a fonte de referência; não substituir por um feed refeito.

## Estrutura verificada
- `site/feed.html`, `site/feed.css`, `site/feed.js`
- `site/nexus-enhancements.js/.css`, `site/nexus-checkout.js/.css`, `site/checkout-config.js`
- `site/dashboard.html`, `site/index.html`, `site/supabase.js`
- `supabase/feed_migration.sql` e `supabase/feed_rollback.sql`
- `documentacao/04_FEED_COMUNIDADE.md`, testes e capturas

## Atenção antes do merge
1. **Não executar SQL em produção.** Validar tabelas, RLS, grants, moderação e anonimização em projeto de teste.
2. **Não sobrescrever** `dashboard.html`, `index.html` e `supabase.js` do GitHub com arquivos do ZIP sem comparar mudanças e preservar login, pagamentos, prontuários e receitas.
3. Confirmar as diferenças da base do ZIP (`VETRIXY_NEXUS_LOGIN_MOBILE_CORRIGIDO_20261016.zip`) com o branch `main` atual.
4. Integrar os arquivos originais do feed e seus assets, e testar com contas de veterinário aprovado, não aprovado e moderador.
5. O checkout antecipado do pacote vem **desligado** e requer provedor + confirmação segura por webhook.
6. O pacote declara testes com Supabase **simulado**; isso não equivale a homologação real.
7. Central de documentos SNCR, exame físico, GTA e CVI permanece em prévia isolada; não emitir documentos oficiais sem integração e autorização.

**Estado deste commit:** auditoria e mapeamento do pacote; arquivos executáveis originais ainda precisam ser transferidos ao branch e testados. **Não publicar no Netlify.**
