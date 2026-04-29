/**
 * Formata data e hora de uma tarefa para exibição nas listas.
 * Ex: "20/04 às 14:30"
 */
export function formatTaskDateTime(due_date?: string | null, due_time?: string | null): string {
  if (!due_date) return ''

  const [year, month, day] = due_date.split('-')
  const dateStr = `${day}/${month}`

  if (!due_time) return dateStr

  // due_time vem como "HH:MM:SS" ou "HH:MM"
  const [hh, mm] = due_time.split(':')
  return `${dateStr} às ${hh}:${mm}`
}
