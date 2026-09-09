# 🏗️ Portal de Agendamento de Carregamento — Grupo Vermont Mineração

> Sistema inteligente e corporativo para controle, agendamento de carregamento de rochas ornamentais e gestão logística nas unidades produtoras da **Vermont Mineração** no Ceará.

---

## 📌 Visão Geral

O **Portal de Agendamento de Carregamento** foi desenvolvido sob medida para modernizar e organizar a logística de retirada de blocos de rochas nobres (quartzitos, mármores e granitos) do Grupo Vermont Mineração. 

O sistema conecta transportadoras, clientes e equipes de logística e balança, eliminando filas desordenadas, garantindo conformidade documental de trânsito e automatizando o despacho de notificações.

---

## 🚀 Inovações e Principais Recursos desta Versão

### 1. 🏢 Nomenclatura e Padronização das Pedreiras Oficiais
As opções de pedreira seguem a denominação institucional e geográfica do Polo de Rochas do Ceará:
* **`URUOCA - CE (TAJ MAHAL)`**
* **`MASSAPÊ - CE (NEGRESCO)`**
* **`MASSAPÊ - CE (DEL MARE)`**
* **`SOBRAL - CE (JAIBARAS)`**
* **`SÃO GONÇALO DO AMARANTE - CE (SERROTE)`**

---

### 2. ⏱️ Bloqueio Inteligente de Horários em Tempo Real
* **Intervalos de 20 Minutos:** Janelas operacionais distribuídas nos turnos da manhã (`07:40` às `12:00`) e tarde (`13:30` às `15:30`).
* **Sincronização Automática:** À medida que um transportador reserva um horário para determinada data e pedreira, esse horário fica automaticamente indisponível para novos agendamentos.
* **Liberação Instantânea:** Caso a logística administrativa cancele um agendamento, o respectivo horário volta a ficar imediatamente disponível para reserva.

---

### 3. 📅 Regra Operacional de Sábado (Exclusividade Uruoca)
* **Operação Restrita:** O carregamento aos sábados é **exclusivo para a pedreira de Uruoca (Taj Mahal)**, com cota máxima limitada a **12 veículos**.
* **Controle de Vagas Dinâmico:** Barra de ocupação visual exibindo as vagas restantes para o sábado selecionado.
* **Bloqueio Preventivo:** Selecionar sábados para as demais pedreiras (Massapê, Sobral e São Gonçalo) exibe aviso orientativo de que as unidades operam de segunda a sexta-feira, bloqueando a submissão.

---

### 4. 📄 Exigência de Documentação Obrigatória na Portaria
Conformidade rigorosa com as normas de transporte de rochas e fiscalização rodoviária. É obrigatório que o condutor porte e apresente na portaria da pedreira:
1. **CRLVs do cavalo e carreta atualizados;**
2. **CNH compatível com o veículo;**
3. **Comprovação de Curso de Cargas Indivisíveis pelo motorista;**
4. **Laudo de inspeção de rochas ou CSV dentro da validade.**

*A exigência é destacada no formulário, no modal de regras, no comprovante oficial e no texto disparado via WhatsApp.*

---

### 5. 🚛 Gestão Completa de Veículos e Placas
* Validação dinâmica de placas conforme o tipo de veículo:
  * **Carreta LS, LS 7 Eixos e Vanderleia:** Placa do Cavalo e Placa da Carreta.
  * **Bitrem (7 Eixos) e Rodotrem (9 Eixos):** Placa do Cavalo, 1ª Carreta e 2ª Carreta (com nomenclatura inteligente sem duplicidade quando houver carreta única).
  * **Bitruck (4 Eixos) e Truck (3 Eixos):** Placa única do caminhão.

---

### 6. 📱 Comprovante Digital & Compartilhamento via WhatsApp
* **Protocolo Único:** Geração de identificador no padrão `#VT-XXXX`.
* **Mensagem Pré-formatada:** Botão de compartilhamento direto via WhatsApp gerando mensagem visual com emojis alusivos ao setor de rochas (`🏗️`, `🪨`, `🚛`), campos em negrito, detalhamento de placas e checklist de documentos.
* **Comprovante para Impressão:** Layout otimizado para impressão e arquivamento físico.

---

### 7. 📧 Notificações Automatizadas por E-mail
* **Despacho Direto:** Notificação imediata para a equipe responsável por e-mail configurado no ambiente.
* **Assunto Dinâmico Padronizado:**
  * Dias Úteis: `Agendamento - [Pedreira] - [Data DD/MM/AA] - [Nº do Bloco]` *(ex: Agendamento - Uruoca - 07/09/26 - VT-5502)*
  * Sábados: `Agendamento - [Pedreira] - Sábado - [Data DD/MM/AA] - [Nº do Bloco]` *(ex: Agendamento - Uruoca - Sábado - 12/09/26 - VT-5502)*
* **Tabela Limpa e em Português-BR:** Todos os termos de formulário organizados sem underscores técnicos.
* **Edge Function v8:** Microsserviço de mensageria hospedado no Supabase pronto para disparo com layout corporativo.

---

### 8. 🔒 Painel Administrativo de Gestão
* **Acesso Restrito:** Autenticação corporativa segura integrada diretamente ao **Supabase Auth** (e-mail e senha criptografados), sem credenciais em texto puro no código ou variáveis públicas.
* **Filtros Operacionais:** Consulta rápida por pedreira, data e status (Confirmado, Carregado, Cancelado).
* **Gestão de Agendamentos:** Capacidade de atualizar status, cancelar registros com reabertura de horário e emitir relatório de romaneio para a balança.

---

### 9. 🎨 Design System Premium Vermont Mineração
* **Identidade Visual Oficial:** Estética inspirada no portal [vermontmineracao.com.br](https://vermontmineracao.com.br), combinando verde esmeralda profundo (`#00762c`), acentos em verde luminoso (`#4ade80`), tipografia moderna e cards em vidro fosco (*glassmorphism*).
* **Multi-Temas Elegantes:**
  * **Negresco (Dark):** Tema escuro profissional com alto contraste.
  * **Taj Mahal (Claro):** Tema claro sofisticado inspirado nos quartzitos nobres.
  * **Grafite:** Variação refinada em tons minerais neutros.
* **Atalho Institucional:** A logomarca oficial da Vermont no topo atua como atalho clicável para retornar imediatamente à tela inicial de novo agendamento.

---

## 🛠️ Tecnologias Utilizadas

* **Frontend:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
* **Ícones:** [Lucide React](https://lucide.dev/)
* **Banco de Dados & Backend Serverless:** [Supabase](https://supabase.com/) (PostgreSQL + Realtime + Edge Functions em Deno)
* **Mensageria de E-mail:** FormSubmit.co Relay + Supabase Edge Functions
* **Estilização:** CSS3 Moderno, Variáveis CSS, Glassmorphism, Design Responsivo

---

## 📦 Como Executar o Projeto Localmente

### 1. Clonar o Repositório
```bash
git clone https://github.com/SEU_USUARIO/Agendamento_Vermont.git
cd Agendamento_Vermont
```

### 2. Instalar as Dependências
```bash
npm install
```

### 3. Configurar as Variáveis de Ambiente
Copie o arquivo de exemplo para criar seu `.env` local:
```bash
cp .env.example .env
```

Preencha as variáveis no arquivo `.env`:
```env
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica-do-supabase
```

> ⚠️ **Atenção:** O arquivo `.env` está configurado no `.gitignore` e nunca deve ser enviado ao controle de versão público.

### 4. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```
O portal estará acessível em `http://localhost:5173`.

### 5. Compilar para Produção
```bash
npm run build
```

---

## 🏛️ Estrutura do Projeto

```text
Agendamento_Vermont/
├── public/                 # Assets públicos e logos
├── src/
│   ├── components/         # Componentes React da interface
│   │   ├── AdminLogin.jsx      # Tela de autenticação administrativa
│   │   ├── AgendamentoForm.jsx # Formulário principal de agendamento
│   │   ├── ComprovanteModal.jsx# Comprovante digital e botão WhatsApp
│   │   ├── Navbar.jsx          # Barra superior institucional e seletor de tema
│   │   ├── PainelGestao.jsx    # Painel administrativo de controle de cargas
│   │   └── RegrasModal.jsx     # Modal com regras operacionais das pedreiras
│   ├── lib/
│   │   └── supabase.js     # Cliente Supabase com variáveis de ambiente
│   ├── services/
│   │   └── agendamentoService.js # Regras de negócio, validações e despacho de e-mails
│   ├── App.jsx             # Componente raiz da aplicação
│   ├── index.css           # Design tokens e temas visuais
│   └── main.jsx            # Ponto de entrada do React
├── supabase/
│   └── functions/
│       └── notificar-agendamento/ # Edge Function (Deno) para disparo de e-mails
├── .env.example            # Modelo seguro de variáveis de ambiente
├── .gitignore              # Proteção contra vazamento de segredos e credenciais
├── package.json
└── vite.config.js
```

---

## 📄 Licença e Direitos

Projeto desenvolvido para uso exclusivo do **Grupo Vermont Mineração Ltda.**  
Todos os direitos reservados © 2026.
