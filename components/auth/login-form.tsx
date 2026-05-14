"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { FormEvent, useMemo, useState } from "react"
import { ArrowRight, BrainCircuit, CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { saveSession } from "@/lib/auth-session"

type AuthState = "idle" | "loading" | "resetting"

type SupabaseAuthResponse = {
  access_token?: string
  expires_at?: number
  expires_in?: number
  msg?: string
  message?: string
  error_description?: string
}

function getSupabaseAuthUrl(path: string) {
  const restUrl = process.env.NEXT_PUBLIC_SUPABASE_REST_URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const baseUrl = supabaseUrl ?? restUrl?.replace(/\/rest\/v1\/?$/, "")

  if (!baseUrl) {
    return null
  }

  return `${baseUrl.replace(/\/$/, "")}/auth/v1/${path.replace(/^\//, "")}`
}

function getAuthErrorMessage(message?: string) {
  if (!message) {
    return "Não foi possível completar o login. Tente novamente."
  }

  const normalizedMessage = message.toLowerCase()

  if (normalizedMessage.includes("invalid login credentials")) {
    return "Email ou senha inválidos."
  }

  if (normalizedMessage.includes("email not confirmed")) {
    return "Confirme seu email antes de entrar."
  }

  return message
}

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberDevice, setRememberDevice] = useState(true)
  const [state, setState] = useState<AuthState>("idle")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  const isLoading = state === "loading"
  const isResetting = state === "resetting"

  const authHeaders = useMemo(() => {
    if (!publishableKey) {
      return null
    }

    return {
      apikey: publishableKey,
      Authorization: `Bearer ${publishableKey}`,
      "Content-Type": "application/json",
    }
  }, [publishableKey])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setNotice("")

    const authUrl = getSupabaseAuthUrl("token?grant_type=password")

    if (!authUrl || !authHeaders) {
      setError("Configure as variáveis públicas do Supabase para habilitar o login.")
      return
    }

    setState("loading")

    try {
      const response = await fetch(authUrl, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ email, password }),
      })
      const data = (await response.json()) as SupabaseAuthResponse

      if (!response.ok) {
        throw new Error(getAuthErrorMessage(data?.msg ?? data?.message ?? data?.error_description))
      }

      saveSession(data, rememberDevice)
      router.push("/")
      router.refresh()
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Não foi possível entrar agora.")
    } finally {
      setState("idle")
    }
  }

  async function handlePasswordReset() {
    setError("")
    setNotice("")

    if (!email) {
      setError("Informe seu email para recuperar a senha.")
      return
    }

    const recoverUrl = getSupabaseAuthUrl("recover")

    if (!recoverUrl || !authHeaders) {
      setError("Configure as variáveis públicas do Supabase para habilitar a recuperação.")
      return
    }

    setState("resetting")

    try {
      const response = await fetch(recoverUrl, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ email }),
      })
      const data = (await response.json().catch(() => null)) as SupabaseAuthResponse | null

      if (!response.ok) {
        throw new Error(getAuthErrorMessage(data?.msg ?? data?.message ?? data?.error_description))
      }

      setNotice("Enviamos as instruções de recuperação para o email informado.")
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Não foi possível enviar a recuperação.")
    } finally {
      setState("idle")
    }
  }

  return (
    <div className="grid min-h-screen w-full bg-[#f7f8f6] text-foreground lg:grid-cols-[minmax(360px,0.95fr)_minmax(520px,1.05fr)]">
      <section className="relative hidden overflow-hidden bg-[#202d2a] lg:block">
        <Image
          src="/bgs/bgdefault.png"
          alt=""
          fill
          priority
          className="object-cover opacity-30 mix-blend-luminosity"
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(18,31,29,0.92),rgba(45,58,42,0.86))]" />
        <div className="relative flex h-full flex-col justify-between px-12 py-10">
          <Image src="/logos/logo-full-dark.png" alt="Neuronz Clinic" width={196} height={76} priority className="h-auto w-48" />

          <div className="max-w-md space-y-6">
            <div className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/8 px-3 py-2 text-sm font-medium text-white/85">
              <BrainCircuit className="h-4 w-4" />
              Atendimento inteligente
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-tight text-white">Sua clínica pronta para atender com clareza.</h1>
              <p className="text-base leading-7 text-white/70">
                Acesse conversas, agenda e tarefas em uma rotina visualmente limpa, com a calma que o cuidado pede.
              </p>
            </div>
          </div>

          <div className="grid gap-3 text-sm text-white/78">
            {["Fluxos de atendimento centralizados", "Agenda e tarefas no mesmo painel", "Base preparada para Supabase Auth"].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8">
        <div className="w-full max-w-[430px]">
          <div className="mb-10 flex justify-center lg:hidden">
            <Image src="/logos/logo-full-light.png" alt="Neuronz Clinic" width={190} height={74} priority className="h-auto w-44" />
          </div>

          <div className="rounded-lg border border-border bg-card p-7 shadow-sm sm:p-8">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-semibold tracking-normal">Entrar</h2>
              <p className="text-sm text-muted-foreground">Faça login para acessar o painel da clínica.</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-11 bg-secondary/60 pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Senha
                </label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Sua senha"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-11 bg-secondary/60 pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  disabled={isLoading || isResetting}
                  className="ml-auto block text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-60"
                >
                  {isResetting ? "Enviando..." : "Esqueceu sua senha?"}
                </button>
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-md border border-border bg-secondary/35 px-3 py-3 text-sm text-muted-foreground transition-colors hover:bg-secondary/60">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(event) => setRememberDevice(event.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                <span>Lembrar este navegador/dispositivo</span>
              </label>

              {error ? <p className="rounded-md border border-destructive/30 bg-destructive/8 px-3 py-2 text-sm text-destructive">{error}</p> : null}
              {notice ? <p className="rounded-md border border-emerald-500/25 bg-emerald-500/8 px-3 py-2 text-sm text-emerald-700">{notice}</p> : null}

              <Button type="submit" className="h-11 w-full gap-2" disabled={isLoading || isResetting}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                Entrar
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}
