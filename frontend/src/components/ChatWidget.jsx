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
  const scrollRef = useRef(null)

  useEffect(() => {
    if (open) {
      setMessages((current) =>
        current.length === 0 ? [{ role: 'assistant', content: GREETING }] : current
      )
    }
  }, [open])

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
      const data = await api.askChatbot(getToken(), message)

      setMessages((current) => [
        ...current,
        { role: 'assistant', content: data.reply || 'No pude generar una respuesta.' }
      ])
    } catch (err) {
      toast.showError(err.message)
    } finally {
      setSending(false)
    }
  }

  const clearConversation = async () => {
    if (sending) return

    try {
      await api.clearChatbot(getToken())
      setMessages([{ role: 'assistant', content: GREETING }])
    } catch (err) {
      toast.showError(err.message)
    }
  }

  return (
    <div
      className="fixed bottom-20 right-4 z-40 flex h-[70vh] max-h-[32rem] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl md:bottom-24 dark:border-slate-700 dark:bg-slate-900"
      role="dialog"
      aria-label="Asistente financiero"
    >
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <MessageCircle size={16} aria-hidden="true" />
          </span>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Asistente financiero</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={clearConversation}
            title="Limpiar conversación"
            aria-label="Limpiar conversación"
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
          >
            <Eraser size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar asistente"
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <p
              className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${
                message.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'
              }`}
            >
              {message.content}
            </p>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <p className="rounded-xl bg-slate-100 px-3 py-2 text-sm italic text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              Pensando…
            </p>
          </div>
        )}
      </div>

      <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-slate-200 px-3 py-3 dark:border-slate-700">
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Escribí tu pregunta…"
          aria-label="Mensaje para el asistente"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          aria-label="Enviar mensaje"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white transition-colors hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
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
