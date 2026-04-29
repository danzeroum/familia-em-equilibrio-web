'use client'
import { useEffect, useState } from 'react'
import { useCategoryStore, TaskCategory } from '@/store/categoryStore'
import { useFamilyStore } from '@/store/familyStore'

const EMOJI_SUGGESTIONS = [
  '📌','📎','🗂️','📁','🗒️','💡','🔑','🏷️','⭐','🔔',
  '🛡️','🧩','🎯','🚀','🌟','💬','🤝','🧹','🔧','📅',
]

export function CategoryManager() {
  const { categories, loading, load, addCategory, deleteCategory } = useCategoryStore()
  const { family } = useFamilyStore()

  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmoji, setNewEmoji] = useState('📌')
  const [newGroup, setNewGroup] = useState('')
  const [customGroup, setCustomGroup] = useState('')
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => { load() }, [])

  // Grupos únicos presentes
  const groups = Array.from(new Set(categories.map(c => c.group_name))).sort()

  // Categorias filtradas por busca
  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.group_name.toLowerCase().includes(search.toLowerCase())
  )

  // Agrupadas
  const grouped = groups.reduce<Record<string, TaskCategory[]>>((acc, g) => {
    acc[g] = filtered.filter(c => c.group_name === g)
    return acc
  }, {})

  async function handleAdd() {
    const name = newName.trim()
    const group = (newGroup === '__novo__' ? customGroup : newGroup).trim()
    if (!name) { alert('Digite o nome da categoria'); return }
    if (!group) { alert('Selecione ou crie um grupo'); return }
    if (!family?.id) { alert('Família não encontrada'); return }
    setSaving(true)
    try {
      await addCategory(name, newEmoji, group, family.id)
      setNewName('')
      setNewEmoji('📌')
      setNewGroup('')
      setCustomGroup('')
      setShowForm(false)
    } catch (e: any) {
      alert('Erro ao salvar: ' + e?.message)
    }
    setSaving(false)
  }

  async function handleDelete(cat: TaskCategory) {
    if (cat.is_default) { alert('Categorias padrão não podem ser removidas.'); return }
    if (!confirm(`Remover "${cat.emoji} ${cat.name}"?`)) return
    try { await deleteCategory(cat.id) }
    catch (e: any) { alert('Erro ao remover: ' + e?.message) }
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Categorias de Tarefas</h2>
          <p className="text-sm text-gray-500 mt-0.5">{categories.length} categorias • {groups.length} grupos</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
        >
          {showForm ? '✕ Fechar' : '+ Nova categoria'}
        </button>
      </div>

      {/* Formulário de nova categoria */}
      {showForm && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-5 space-y-3">
          <p className="text-sm font-semibold text-teal-700">Nova categoria personalizada</p>

          {/* Emoji picker */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">Emoji</label>
            <div className="flex flex-wrap gap-1 mb-2">
              {EMOJI_SUGGESTIONS.map(e => (
                <button
                  key={e}
                  onClick={() => setNewEmoji(e)}
                  className={`text-xl p-1 rounded transition-colors ${
                    newEmoji === e ? 'bg-teal-200 ring-2 ring-teal-400' : 'hover:bg-gray-100'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                className="input-base w-20 text-center text-lg"
                value={newEmoji}
                onChange={e => setNewEmoji(e.target.value)}
                placeholder="✏️"
                maxLength={4}
              />
              <span className="text-xs text-gray-400">ou cole qualquer emoji</span>
            </div>
          </div>

          {/* Nome */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">Nome da categoria *</label>
            <input
              className="input-base"
              placeholder="Ex: Reunião de Condomínio"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
          </div>

          {/* Grupo */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">Grupo *</label>
            <select
              className="input-base"
              value={newGroup}
              onChange={e => setNewGroup(e.target.value)}
            >
              <option value="">— Selecione um grupo —</option>
              {groups.map(g => <option key={g} value={g}>{g}</option>)}
              <option value="__novo__">✨ Criar novo grupo...</option>
            </select>
            {newGroup === '__novo__' && (
              <input
                className="input-base mt-2"
                placeholder="Nome do novo grupo"
                value={customGroup}
                onChange={e => setCustomGroup(e.target.value)}
              />
            )}
          </div>

          {/* Preview */}
          {newName && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-white rounded-lg px-3 py-2 border">
              <span className="text-lg">{newEmoji}</span>
              <span className="font-medium">{newName}</span>
              <span className="text-gray-400 text-xs ml-auto">{newGroup === '__novo__' ? customGroup : newGroup}</span>
            </div>
          )}

          <button
            onClick={handleAdd}
            disabled={saving}
            className="w-full bg-teal-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Salvando...' : 'Salvar categoria'}
          </button>
        </div>
      )}

      {/* Busca */}
      <div className="relative mb-4">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
        <input
          className="input-base pl-8"
          placeholder="Buscar categoria ou grupo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Lista por grupo */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : (
        <div className="space-y-5">
          {groups.map(group => {
            const items = grouped[group]
            if (!items?.length) return null
            return (
              <div key={group}>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  {group} <span className="font-normal normal-case">({items.length})</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {items.map(cat => (
                    <div
                      key={cat.id}
                      className="flex items-center gap-2 bg-white border border-gray-100 rounded-lg px-3 py-2 group hover:border-gray-200 transition-colors"
                    >
                      <span className="text-lg">{cat.emoji}</span>
                      <span className="text-sm text-gray-700 flex-1">{cat.name}</span>
                      {cat.is_default ? (
                        <span className="text-xs text-gray-300">padrão</span>
                      ) : (
                        <button
                          onClick={() => handleDelete(cat)}
                          className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-xs"
                          title="Remover"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-3xl mb-2">🔍</p>
              <p>Nenhuma categoria encontrada para "{search}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
