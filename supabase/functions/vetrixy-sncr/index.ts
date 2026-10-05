import { createClient } from 'jsr:@supabase/supabase-js@2.95.0'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: CORS })

async function authenticatedVet(req: Request) {
  const token=(req.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'')
  if(!token) return null
  const url=Deno.env.get('SUPABASE_URL'), anon=Deno.env.get('SUPABASE_ANON_KEY')
  if(!url||!anon) return null
  const supabase=createClient(url,anon,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}})
  const {data:{user},error}=await supabase.auth.getUser(token)
  if(error||!user) return null
  const {data:vet}=await supabase.from('veterinarios').select('user_id,aprovado,crmv,nome').eq('user_id',user.id).single()
  if(!vet?.aprovado) return null
  return {user,vet}
}

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS') return new Response(null,{status:204,headers:CORS})
  if(req.method!=='POST') return json({error:'Método não permitido.'},405)
  try{
    const identity=await authenticatedVet(req)
    if(!identity) return json({error:'Profissional não autenticado ou não aprovado.'},403)
    const body=await req.json()
    const action=String(body?.action||'issue')

    // A autenticação SNCR é individual e acontece no navegador pelo fluxo oficial
    // login -> session_id -> access_token. O token regulatório não é armazenado aqui.
    if(action==='credential_status'){
      return json({ok:true,status:'CONEXÃO INDIVIDUAL',detail:'A conexão SNCR é feita individualmente pelo profissional autenticado via Gov.br/SNCR.'})
    }
    if(action==='credential_start'){
      return json({ok:false,error:'O início do login SNCR deve ocorrer no navegador pelo fluxo oficial.'},400)
    }
    if(action==='issue'){
      // Fail-closed: emissão permanece bloqueada até o contrato oficial do tipo
      // solicitado estar implementado e validado. O receituário comum não passa aqui.
      return json({ok:false,error:'Emissão SNCR ainda não habilitada para este tipo de receituário.'},501)
    }
    return json({error:'Ação inválida.'},400)
  }catch(error){
    console.error('Vetrixy SNCR error',error instanceof Error?error.message:'unknown')
    return json({error:'Erro interno da integração SNCR.'},500)
  }
})
