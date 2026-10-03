// Regla puntual, no un setup completo de lint para el proyecto (eso sería
// otra tarea aparte) — bloquea en el momento de escribir código el bug de
// UTC-vs-local que ya se corrigió varias veces a mano (ver Claude.md,
// "Convenciones de código"): .toISOString() sobre una fecha local corre el
// día en Argentina (UTC-3), de noche. hoyLocalISO() en utils/format.js es
// el lugar correcto para sacar la fecha de hoy en local.
export default [
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.property.name='toISOString']",
          message: 'No uses .toISOString() directo para fechas locales — corre el día en UTC+. Usá hoyLocalISO() de utils/format.js, o sumale el offset si es un caso nuevo.',
        },
      ],
    },
  },
  {
    // hoyLocalISO() es la única función que legítimamente necesita
    // .toISOString() — lo usa sobre una fecha ya corregida con el offset
    // local, no directo. Confirmado leyendo el archivo antes de excluirlo,
    // no asumido.
    files: ['src/utils/format.js'],
    rules: { 'no-restricted-syntax': 'off' },
  },
]
