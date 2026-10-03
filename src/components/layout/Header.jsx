import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell } from 'lucide-react'
import Avatar from '../ui/Avatar'
import Badge from '../ui/Badge'
import { AuthContext } from '../../context/AuthContext'

export default function Header({ noLeidas = 0, mostrarVolver = false }) {
  const navigate = useNavigate()
  const { nombre } = useContext(AuthContext)

  return (
    <header className="flex items-center justify-between gap-2 px-4 py-3 bg-white border-b border-gray-200 shrink-0">
      {mostrarVolver ? (
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-lg text-gray-500 hover:bg-primary-light hover:text-primary transition-colors"
          aria-label="Volver"
        >
          <ArrowLeft size={20} />
        </button>
      ) : (
        <button type="button" onClick={() => navigate('/perfil')} aria-label="Perfil">
          <Avatar nombre={nombre} />
        </button>
      )}

      <button
        type="button"
        onClick={() => navigate('/notificaciones')}
        className="relative p-2 rounded-lg text-gray-500 hover:bg-primary-light hover:text-primary transition-colors"
        aria-label="Notificaciones"
      >
        <Bell size={20} />
        {noLeidas > 0 && (
          <span className="absolute -top-1 -right-1">
            <Badge color="red">{noLeidas}</Badge>
          </span>
        )}
      </button>
    </header>
  )
}
