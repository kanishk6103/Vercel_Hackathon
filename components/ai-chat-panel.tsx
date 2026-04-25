"use client"

import { useState, useRef, useEffect, Fragment } from "react"
import { ArrowUp, Sparkles, Wrench, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { useChat } from "@ai-sdk/react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const TOOL_LABELS: Record<string, string> = {
  listOpenPullRequests: "Listing open PRs",
  getPullRequest: "Reading PR metadata",
  getPullRequestFiles: "Reading PR files",
  getPullRequestDiff: "Reading PR diff",
  getFileContents: "Reading file",
  getDeployments: "Reading deployments",
}

const PROMPT_CHIPS = [
  "What broke production today?",
  "Which PR is most risky?",
  "Summarize today's activity",
  "Any patterns in failures?",
]

export function AIChatPanel({ contextLabel }: { contextLabel?: string }) {
  const { messages, sendMessage, status, error } = useChat()
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  const isStreaming = status === "submitted" || status === "streaming"

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  function submit(text: string) {
    const trimmed = text.trim()
    if (!trimmed || isStreaming) return
    sendMessage({ text: trimmed })
    setInput("")
  }

  return (
    <aside
      aria-label="AI Assistant"
      className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card"
    >
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-foreground">AI Assistant</h2>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">Powered by GPT-4.1</p>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-2.5 py-1">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-[11px] font-medium text-foreground/80">Live context</span>
        </div>
      </div>

      <div className="border-b border-border px-4 py-3">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {PROMPT_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => submit(chip)}
              disabled={isStreaming}
              className="shrink-0 rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground/85 transition-colors hover:bg-secondary/70 hover:text-foreground disabled:opacity-50"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && !error ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/30">
              <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <p className="text-sm font-medium text-foreground">Ask anything about your repo</p>
            <p className="max-w-[260px] text-xs text-muted-foreground">
              Pick a suggestion above or type a question. Responses use your live PR and deployment data.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {messages.map((m) => (
              <li
                key={m.id}
                className={
                  m.role === "user" ? "flex justify-end" : "flex items-start gap-2.5"
                }
              >
                {m.role === "assistant" && (
                  <Avatar className="mt-0.5 h-7 w-7 shrink-0 ring-1 ring-primary/30">
                    <AvatarFallback className="bg-primary/20 text-[10px] font-semibold text-primary">
                      AI
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-3.5 py-2 text-sm leading-relaxed text-primary-foreground shadow-sm"
                      : "flex max-w-[88%] flex-col gap-2 rounded-2xl rounded-tl-sm bg-secondary/70 px-3.5 py-2.5 text-sm leading-relaxed text-foreground/90 ring-1 ring-inset ring-border"
                  }
                >
                  {m.parts.map((part, i) => {
                    if (part.type === "text") {
                      return <Fragment key={i}>{renderMessage(part.text)}</Fragment>
                    }
                    if (typeof part.type === "string" && part.type.startsWith("tool-")) {
                      // Cast: AI SDK v6 typed tool parts have toolName/state/input/output
                      const tp = part as unknown as {
                        type: string
                        toolName?: string
                        state?: string
                        input?: unknown
                        output?: unknown
                      }
                      const name = tp.toolName ?? part.type.replace(/^tool-/, "")
                      return <ToolCallPill key={i} name={name} state={tp.state} input={tp.input} />
                    }
                    return null
                  })}
                </div>
              </li>
            ))}
            {isStreaming && messages[messages.length - 1]?.role === "user" && (
              <li className="flex items-start gap-2.5">
                <Avatar className="mt-0.5 h-7 w-7 shrink-0 ring-1 ring-primary/30">
                  <AvatarFallback className="bg-primary/20 text-[10px] font-semibold text-primary">
                    AI
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-2xl rounded-tl-sm bg-secondary/70 px-3.5 py-2.5 text-sm text-muted-foreground ring-1 ring-inset ring-border">
                  <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-foreground/60 [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-foreground/60 [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-foreground/60" />
                  </span>
                </div>
              </li>
            )}
            {error && (
              <li className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                {error.message || "Something went wrong."}
              </li>
            )}
          </ul>
        )}
      </div>

      <div className="border-t border-border bg-card/60 px-4 pb-4 pt-3">
        {contextLabel && (
          <p className="mb-2 text-[11px] text-muted-foreground">Context: {contextLabel}</p>
        )}
        <form
          className="flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-1.5 py-1.5 focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/40"
          onSubmit={(e) => {
            e.preventDefault()
            submit(input)
          }}
        >
          <label htmlFor="chat-input" className="sr-only">
            Ask the AI assistant
          </label>
          <input
            id="chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your codebase, PRs, deployments..."
            className="flex-1 bg-transparent px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Send message"
            disabled={!input.trim() || isStreaming}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-40"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </form>
      </div>
    </aside>
  )
}

function ToolCallPill({
  name,
  state,
  input,
}: {
  name: string
  state?: string
  input?: unknown
}) {
  const label = TOOL_LABELS[name] ?? name
  const subject = describeInput(name, input)
  const done = state === "output-available"
  const errored = state === "output-error"
  const Icon = errored ? AlertCircle : done ? CheckCircle2 : Loader2
  const color = errored
    ? "text-red-400"
    : done
      ? "text-emerald-400"
      : "text-amber-400"

  return (
    <div className="inline-flex w-fit items-center gap-1.5 rounded-md border border-border bg-background/40 px-2 py-1 text-[11px] font-medium text-muted-foreground">
      <Wrench className="h-3 w-3" aria-hidden="true" />
      <span>{label}</span>
      {subject && <span className="font-mono text-foreground/80">{subject}</span>}
      <Icon className={`h-3 w-3 ${color} ${!done && !errored ? "animate-spin" : ""}`} aria-hidden="true" />
    </div>
  )
}

function describeInput(name: string, input: unknown): string | null {
  if (!input || typeof input !== "object") return null
  const i = input as Record<string, unknown>
  if (name === "getFileContents" && typeof i.path === "string") {
    return i.ref ? `${i.path}@${String(i.ref).slice(0, 7)}` : i.path
  }
  if (typeof i.number === "number") return `#${i.number}`
  return null
}

function renderMessage(content: string) {
  const blocks = content.split(/(```[\s\S]*?```)/g)
  return (
    <>
      {blocks.map((block, bi) => {
        if (block.startsWith("```") && block.endsWith("```")) {
          const inner = block.slice(3, -3)
          const newlineIdx = inner.indexOf("\n")
          const lang = newlineIdx > 0 ? inner.slice(0, newlineIdx).trim() : ""
          const code = newlineIdx > 0 ? inner.slice(newlineIdx + 1) : inner
          return (
            <pre
              key={bi}
              className="my-1.5 max-h-[400px] overflow-auto rounded-lg border border-border bg-background/70 p-2.5 font-mono text-[11.5px] leading-relaxed text-foreground/90"
            >
              {lang && (
                <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {lang}
                </div>
              )}
              <code>{code.replace(/\n+$/, "")}</code>
            </pre>
          )
        }
        const inlineParts = block.split(/(`[^`\n]+`|#\d{2,5})/g)
        return (
          <span key={bi} className="whitespace-pre-wrap">
            {inlineParts.map((part, i) => {
              if (part.startsWith("`") && part.endsWith("`")) {
                return (
                  <code
                    key={i}
                    className="rounded bg-background/60 px-1 py-0.5 font-mono text-[12px] text-foreground/90"
                  >
                    {part.slice(1, -1)}
                  </code>
                )
              }
              if (/^#\d+$/.test(part)) {
                return (
                  <span key={i} className="font-mono text-primary">
                    {part}
                  </span>
                )
              }
              return <Fragment key={i}>{part}</Fragment>
            })}
          </span>
        )
      })}
    </>
  )
}
