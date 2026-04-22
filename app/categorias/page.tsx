import { CategoryManager } from '@/components/categories/CategoryManager'
import { redirect } from 'next/navigation'
export const metadata = { title: 'Categorias — Família em Equilíbrio' }

export default function CategoriasPage() {
  redirect('/configuracoes?tab=categorias')
}
