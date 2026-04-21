import { useState } from 'react';
import { useFamilyStore } from '@/store/familyStore';
import { useAuthStore } from '@/store/authStore'; // ou como você acessa o user
import { ParsedItem } from '@/types/chatbot';

export function useChatbot() {
  const { familyId } = useFamilyStore();
  const { user } = useAuthStore(); // profile UUID do usuário logado
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ParsedItem[] | null>(null);

  async function parseText(text: string) {
    setLoading(true);
    const res = await fetch('/api/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        familyId,
        createdBy: user?.id,
        autoInsert: false
      })
    });
    const data = await res.json();
    setPreview(data.preview);
    setLoading(false);
  }

  async function confirmInsert(items: ParsedItem[]) {
    setLoading(true);
    // Re-envia com os itens editados pelo usuário
    const res = await fetch('/api/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: items.map(i => i.title).join('\n'), // reconstrói texto dos itens confirmados
        familyId,
        createdBy: user?.id,
        autoInsert: true
      })
    });
    const data = await res.json();
    setPreview(null);
    setLoading(false);
    return data.insertResult;
  }

  return { loading, preview, setPreview, parseText, confirmInsert };
}
