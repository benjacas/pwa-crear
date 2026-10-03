import { useEffect, useState } from 'react'
import Modal from './ui/Modal'
import Input from './ui/Input'
import Button from './ui/Button'
import { useToast } from '../context/ToastContext'

// Mismos límites que PerfilTutorUpdate en el backend (app/schemas/tutor.py)
// — se valida acá para no depender solo del 422, pero el mensaje real del
// backend sigue siendo el que se muestra si igual llega a fallar.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validar(form) {
  const errores = {}
  const telefono = form.telefono_whatsapp.trim()
  if (telefono.length < 6) errores.telefono_whatsapp = 'Mínimo 6 caracteres.'
  else if (telefono.length > 30) errores.telefono_whatsapp = 'Máximo 30 caracteres.'
  if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) errores.email = 'Ingresá un email válido.'
  if (form.direccion.length > 255) errores.direccion = 'Máximo 255 caracteres.'
  return errores
}

export default function EditarContactoModal({ isOpen, onClose, perfil, onGuardar }) {
  const toast = useToast()
  const [form, setForm] = useState(null)
  const [errores, setErrores] = useState({})
  const [errorServidor, setErrorServidor] = useState('')
  const [guardando, setGuardando] = useState(false)

  // Se resincroniza cada vez que se abre (no solo al montar) — así, si se
  // guardó una vez y se reabre, arranca con el valor ya persistido, no con
  // el que tenía la primera vez que se montó el modal.
  useEffect(() => {
    if (isOpen && perfil) {
      setForm({
        telefono_whatsapp: perfil.telefono_whatsapp ?? '',
        email: perfil.email ?? '',
        direccion: perfil.direccion ?? '',
      })
      setErrores({})
      setErrorServidor('')
    }
  }, [isOpen, perfil])

  if (!isOpen || !form) return null

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validar(form)
    setErrores(errs)
    if (Object.keys(errs).length > 0) return

    // Solo se manda lo que cambió — si no cambió nada, el backend responde
    // 400 ERR_SIN_CAMBIOS, y ese mensaje real es el que se muestra.
    const cambios = {}
    const telefono = form.telefono_whatsapp.trim()
    const email = form.email.trim()
    const direccion = form.direccion.trim()
    if (telefono !== (perfil.telefono_whatsapp ?? '')) cambios.telefono_whatsapp = telefono
    if (email !== (perfil.email ?? '')) cambios.email = email || null
    if (direccion !== (perfil.direccion ?? '')) cambios.direccion = direccion || null

    setGuardando(true)
    setErrorServidor('')
    try {
      await onGuardar(cambios)
      toast('Datos de contacto actualizados.')
      onClose()
    } catch (err) {
      setErrorServidor(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar datos de contacto" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorServidor && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
            {errorServidor}
          </div>
        )}

        <Input
          label="Teléfono / WhatsApp"
          value={form.telefono_whatsapp}
          onChange={(e) => setForm({ ...form, telefono_whatsapp: e.target.value })}
          error={errores.telefono_whatsapp}
          autoComplete="tel"
        />
        <div>
          <Input
            id="email"
            label="Email de contacto"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={errores.email}
            autoComplete="email"
          />
          <p className="text-xs text-gray-400 mt-1">
            Este email es para que la academia te contacte — no es el que usás para iniciar sesión.
          </p>
        </div>
        <Input
          label="Dirección"
          value={form.direccion}
          onChange={(e) => setForm({ ...form, direccion: e.target.value })}
          error={errores.direccion}
          autoComplete="street-address"
        />

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" className="flex-1 justify-center" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" className="flex-1 justify-center" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
