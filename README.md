<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Senior Scout 360 🔍

**Inteligência Comercial para Agronegócio** · Powered by Google Gemini

Plataforma de análise de prospects e empresas do setor agro, com IA para gerar insights táticos, scores de oportunidade (PORTA) e dossies completos.

View your app in AI Studio: https://ai.studio/apps/182de9ab-2fde-4da5-b2b8-d98c6054cb82

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (recomendado: 20.x)
- **npm** ou **yarn**
- **Gemini API Key** ([Obtenha aqui](https://aistudio.google.com/app/apikey))

### 1️⃣ Instalar dependências

```bash
npm install
```

### 2️⃣ Configurar variáveis de ambiente

Copie o arquivo de exemplo:

```bash
cp .env.example .env.local
```

Edite `.env.local` e adicione sua **Gemini API Key**:

```env
GEMINI_API_KEY=sua_chave_gemini_aqui
```

> ⚠️ **Importante:** O arquivo `.env.local` é ignorado pelo Git. Nunca commite chaves de API.

### 3️⃣ Rodar localmente

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

---

## 📦 Build para Produção

```bash
npm run build
npm run preview  # Testar build local
```

---

## 🚀 Deploy no Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/brunolimaff-jpg/novo-app-teste)

**Variáveis de ambiente necessárias no Vercel:**

- `GEMINI_API_KEY` → Sua chave da API do Google Gemini

---

## 🛠️ Tecnologias

- **React 18** + **TypeScript**
- **Vite** (build tool)
- **Tailwind CSS** (estilização)
- **Google Gemini API** (IA generativa)
- **Firebase** (autenticação)
- **Vercel** (hosting)

---

## 📝 Scripts Disponíveis

```bash
npm run dev        # Servidor de desenvolvimento (porta 3000)
npm run build      # Build de produção
npm run preview    # Preview do build
npm run lint       # Linter ESLint
```

---

## 🐛 Troubleshooting

### Erro: "API_KEY environment variable is missing"

✅ **Solução:** Crie o arquivo `.env.local` (copie do `.env.example`) e adicione sua chave Gemini.

### Erro: "Sender is not defined"

✅ **Solução:** Já corrigido nos últimos commits. Faça `git pull` para atualizar.

### Erro no console: "linkedInSearch.js"

✅ **Solução:** Limpe o cache do browser (`Ctrl+Shift+R` ou `Cmd+Shift+R`). Esse arquivo não existe no projeto.

### Erro: "Failed to list sessions"

⚠️ **Não-crítico:** O backend do Google Sheets pode estar offline. O app funciona normalmente com armazenamento local (localStorage).

---

## 📚 Documentação Adicional

- [Gemini API Docs](https://ai.google.dev/docs)
- [Vite Configuration](https://vitejs.dev/config/)
- [React TypeScript](https://react-typescript-cheatsheet.netlify.app/)

---

## 🔐 Segurança

- ✅ Chaves de API nunca são commitadas (`.gitignore` protege `.env.local`)
- ✅ Rate limiting implementado para evitar abuso da API
- ✅ Todas as requisições passam por validação de CORS

---

## 👥 Contribuindo

Pull requests são bem-vindos! Para mudanças importantes, abra uma issue primeiro.

---

## 📝 License

Proprietário · Senior Sistemas S.A.
