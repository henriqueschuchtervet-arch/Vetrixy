import { createClient } from 'jsr:@supabase/supabase-js@2.95.0'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: CORS })

async function authenticatedVet(req: Request) {
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '')
  if (!token) return null
  const url = Deno.env.get('SUPABASE_URL')
  const anon = Deno.env.get('SUPABASE_ANON_KEY')
  if (!url || !anon) return null
  const supabase = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  const { data: vet } = await supabase.from('veterinarios')
    .select('user_id,aprovado,crmv,nome').eq('user_id', user.id).single()
  if (!vet?.aprovado) return null
  return { user, vet }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Método não permitido.' }, 405)

  try {
    const identity = await authenticatedVet(req)
    if (!identity) return json({ error: 'Profissional não autenticado ou não aprovado.' }, 403)
    const body = await req.json()
    const action = String(body?.action || 'issue')

    // Integração regulatória permanece fechada até as credenciais oficiais serem configuradas.
    const apiBase = Deno.env.get('SNCR_API_BASE_URL')
    const clientId = Deno.env.get('SNCR_CLIENT_ID')
    const clientSecret = Deno.env.get('SNCR_CLIENT_SECRET')
    const configured = Boolean(apiBase && clientId && clientSecret)

    if (action === 'credential_status') {
      return json({
        ok: true,
        status: configured ? 'INTEGRAÇÃO CONFIGURADA' : 'AGUARDANDO HABILITAÇÃO',
        detail: configured
          ? 'A integração institucional está configurada. A habilitação individual será validada pelo serviço oficial.'
          : 'A Vetrixy ainda aguarda as credenciais oficiais do serviço regulatório.',
      })
    }

    if (action === 'credential_start') {
      if (!configured) return json({
        ok: false,
        status: 'AGUARDANDO HABILITAÇÃO',
        detail: 'Credenciais oficiais do SNCR ainda não configuradas.',
      }, 503)
      return json({ ok: false, status: 'PENDENTE', detail: 'Fluxo oficial de credenciamento individual será ativado conforme o contrato de autenticação do SNCR.' }, 501)
    }

    if (action === 'issue') {
      if (!configured) return json({ ok: false, error: 'Integração oficial SNCR ainda não habilitada.' }, 503)
      // Não envia prescrição a endpoint não verificado.
      return json({ ok: false, error: 'Emissão bloqueada até validação do contrato oficial do SNCR.' }, 501)
    }

    return json({ error: 'Ação inválida.' }, 400)
  } catch (error) {
    console.error('Vetrixy SNCR error', error instanceof Error ? error.message : 'unknown')
    return json({ error: 'Erro interno da integração SNCR.' }, 500)
  }
})
