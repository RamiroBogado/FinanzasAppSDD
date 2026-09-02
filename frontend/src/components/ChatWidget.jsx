import { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { Eraser, MessageCircle, SendHorizonal, X } from 'lucide-react'
import { api, getToken } from '../api.js'
import { useToast } from './ui/ToastProvider.jsx'

const GREETING = '¡Hola! Preguntame por tus transacciones, presupuestos o metas.'

const ChatWidget = ({ open, onClose }) => {
  const toast = useToast()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [action, setAction] = useState(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (!open || historyLoaded) return

    let cancelled = false
    setLoadingHistory(true)
    setMessages([])

    api
      .listChatMessages(getToken())
      .then((data) => {
        if (cancelled) return

        const history = (data || []).map((message) => ({
          role: message.role,
          content: message.content
        }))

        setMessages(history.length > 0 ? history : [{ role: 'assistant', content: GREETING }])
        setHistoryLoaded(true)
      })
      .catch((err) => {
        if (!cancelled) {
          setMessages([{ role: 'assistant', content: GREETING }])
          toast.showError(err.message)
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingHistory(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, historyLoaded, toast])

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, sending, open])

  if (!open) return null

  const sendMessage = async (event) => {
    event.preventDefault()

    const message = input.trim()
    if (!message || sending) return

    setInput('')
    setSending(true)
    setMessages((current) => [...current, { role: 'user', content: message }])

    try {
      const data = await api.sendChatMessage(getToken(), message)

      setMessages((current) => [
        ...current,
        { role: 'assistant', content: data.reply || 'No pude generar una respuesta.' }
      ])
      setAction(data.action || null)
    } catch (err) {
      toast.showError(err.message)
    } finally {
      setSending(false)
    }
  }

  const confirmAction = async () => {
    if (!action || sending) return
    setSending(true)
    try {
      const response = await api.confirmChatAction(getToken(), action.id)
      const result = response.request?.result
      setMessages((current) => [...current, { role: 'assistant', content: result?.message || 'Acción realizada.' }])
      if (result?.download) await api.exportTransactions(getToken(), result.download.params, result.download.format)
      setAction(null)
    } catch (err) {
      toast.showError(err.message)
    } finally {
      setSending(false)
    }
  }

  const cancelAction = async () => {
    if (!action || sending) return
    try {
      await api.cancelChatAction(getToken(), action.id)
      setMessages((current) => [...current, { role: 'assistant', content: 'Acción cancelada.' }])
      setAction(null)
    } catch (err) {
      toast.showError(err.message)
    }
  }

  const clearConversation = async () => {
    if (sending) return

    try {
      await api.clearChatMessages(getToken())
      setMessages([{ role: 'assistant', content: GREETING }])
    } catch (err) {
      toast.showError(err.message)
    }
  }

  return (
    <div
      className="fixed bottom-20 right-4 z-40 flex h-[70vh] max-h-[32rem] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-2xl md:bottom-24 dark:border-slate-700 dark:bg-slate-900"
      role="dialog"
      aria-label="Asistente financiero"
    >
      <div className="flex items-center justify-between border-b border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0e9f6e] text-white">
            <MessageCircle size={16} aria-hidden="true" />
          </span>
          <h2 className="text-sm font-semibold text-[#171d19] dark:text-white">Asistente financiero</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={clearConversation}
            title="Limpiar conversación"
            aria-label="Limpiar conversación"
            className="rounded-lg p-2 text-[#64748B] transition-colors hover:bg-slate-200 hover:text-[#3d4a42] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e9f6e] dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
          >
            <Eraser size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar asistente"
            className="rounded-lg p-2 text-[#64748B] transition-colors hover:bg-slate-200 hover:text-[#3d4a42] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e9f6e] dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {loadingHistory && (
          <p className="text-center text-xs italic text-slate-400 dark:text-[#64748B]">
            Cargando conversación…
          </p>
        )}
        {!loadingHistory &&
          messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <p
                className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${
                  message.role === 'user'
                    ? 'bg-[#0e9f6e] text-white'
                    : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'
                }`}
              >
                {message.content}
              </p>
            </div>
          ))}
        {sending && (
          <div className="flex justify-start">
            <p className="rounded-xl bg-slate-100 px-3 py-2 text-sm italic text-[#64748B] dark:bg-slate-800 dark:text-slate-400">
              Pensando…
            </p>
          </div>
        )}
        {action && (
          <div className="rounded-xl border border-[#0e9f6e] bg-[#effcf6] p-3 text-sm text-slate-800 dark:bg-slate-800 dark:text-slate-100">
            <p className="mb-3">{action.summary}</p>
            <div className="flex gap-2">
              <button type="button" onClick={confirmAction} className="rounded-lg bg-[#0e9f6e] px-3 py-1.5 font-medium text-white">Confirmar</button>
              <button type="button" onClick={cancelAction} className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium">Cancelar</button>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-[#E2E8F0] px-3 py-3 dark:border-slate-700">
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Escribí tu pregunta…"
          aria-label="Mensaje para el asistente"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-[#171d19] placeholder-slate-400 focus:border-[#0e9f6e] focus:outline-none focus:ring-2 focus:ring-[#0e9f6e]/40 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          aria-label="Enviar mensaje"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0e9f6e] text-white transition-colors hover:bg-[#0a7a53] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e9f6e] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <SendHorizonal size={16} aria-hidden="true" />
        </button>
      </form>
    </div>
  )
}

ChatWidget.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
}

export default ChatWidget
