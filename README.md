# 🏠 Família em Equilíbrio — Web App

Aplicativo web de gestão doméstica familiar, construído com Next.js 14 e Supabase.

## Stack

- **Next.js 14** (App Router)
- **Tailwind CSS** + **shadcn/ui**
- **Supabase** (banco de dados + autenticação)
- **Zustand** (estado global)
- **date-fns** (manipulação de datas)

## Módulos

| Rota | Módulo |
|------|--------|
| `/` | 🎯 Painel de Antecipação |
| `/familia` | 👨‍👩‍👧‍👦 Cadastro da Família |
| `/semana` | 📅 Rotina Semanal |
| `/casa` | 🏠 Gestão da Casa |
| `/saude` | 🩺 Saúde e Medicamentos |
| `/agenda` | 💰 Agenda e Finanças |

## Como rodar

```bash
npm install
cp .env.local.example .env.local
# Preencha o .env.local com suas chaves do Supabase
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)
