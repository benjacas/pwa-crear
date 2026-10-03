import Modal from './Modal'
import Button from './Button'

export default function ConfirmModal({
  isOpen, onClose, onConfirm,
  title = '¿Estás seguro?',
  message,
  confirmLabel = 'Eliminar',
  variant = 'danger',
}) {
  function handleConfirm() {
    onConfirm()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-5">
        {message && <p className="text-sm text-gray-600 leading-relaxed">{message}</p>}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant={variant} onClick={handleConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </Modal>
  )
}
