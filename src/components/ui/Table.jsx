export function Table({ children, className = '', plain = false }) {
  const wrapper = plain
    ? `overflow-x-auto ${className}`
    : `overflow-x-auto rounded-xl border border-gray-200 bg-white ${className}`
  return (
    <div className={wrapper}>
      <table className="w-full text-sm">{children}</table>
    </div>
  )
}

export function Thead({ children }) {
  return (
    <thead className="bg-gray-50/80 border-b border-gray-100">
      {children}
    </thead>
  )
}

export function Th({ children, className = '' }) {
  return (
    <th className={`px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  )
}

export function Tbody({ children }) {
  return <tbody className="divide-y divide-gray-50">{children}</tbody>
}

export function Tr({ children, className = '' }) {
  return <tr className={`hover:bg-gray-50/60 transition-colors ${className}`}>{children}</tr>
}

export function Td({ children, className = '' }) {
  return <td className={`px-4 py-3.5 text-gray-700 ${className}`}>{children}</td>
}
