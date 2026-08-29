# BeeVolt Projects

Monorepo dos projetos BeeVolt, organizado para manter backend, bot, integrações e pacotes compartilhados em um único lugar, com fronteiras claras entre responsabilidades.

O objetivo desta base é simples: facilitar manutenção, evolução gradual e onboarding de novos colaboradores sem esconder a estrutura real do sistema.

## Visão Geral

O repositório é dividido em três camadas principais:

- `apps/` contém os aplicativos executáveis e integrações completas.
- `packages/` contém bibliotecas compartilhadas entre os apps.
- `main.js` é o launcher raiz que orquestra os apps com `dev`, `start` e `deploy`.

Cada app tem seu próprio `package.json` e seus próprios scripts. O launcher raiz percorre os apps e executa somente os que possuem o script solicitado, ignorando entradas de deploy que não devem subir como processo Node.

## Estrutura Do Monorepo

```text
.
├── apps/
├── packages/
├── main.js
├── package.json
└── README.md
```

### `apps/`

Reúne os produtos e serviços do BeeVolt. Cada diretório aqui representa uma aplicação com ciclo de vida próprio.

### `packages/`

Agrupa bibliotecas reutilizáveis. São módulos internos usados por mais de um app, como persistência e logging.

### `main.js`

Orquestra a execução dos apps do monorepo. Na prática, ele:

- lê os `package.json` de cada app;
- identifica se existe script `dev`, `start` ou `deploy`;
- executa apenas os apps que fazem sentido para o modo atual;
- encerra os processos filhos de forma graciosa quando recebe `SIGINT` ou `SIGTERM`.

## Padrões De Organização

Para manter o monorepo previsível, seguimos alguns padrões simples.

### 1. Cada app é autônomo

Todo app em `apps/` deve conseguir explicar sozinho como roda:

- tem seu próprio `package.json`;
- define os scripts que faz sentido expor;
- importa dependências compartilhadas por `@beevolt/*`;
- não depende de um layout implícito fora do seu diretório.

### 2. Código separado por responsabilidade

Quando um app cresce, o código é dividido por camada ou por domínio.

Exemplo de organização esperada:

- `controller`: entrada de requisições ou comandos;
- `service`: regras de negócio e orquestração;
- `repository`: acesso a dados e persistência;
- `domain`: normalização e transformação de dados;
- `utils`: funções auxiliares pequenas e reutilizáveis;
- `config`: valores e configurações da aplicação;
- `routes` ou `triggers`: pontos de entrada externos;
- `ui`: telas, formulários ou componentes de interface.

### 3. Dependências compartilhadas ficam em `packages/`

Se algo é útil para mais de um app, ele deve viver em `packages/`, não copiado entre projetos.

Hoje isso cobre principalmente:

- `@beevolt/database`
- `@beevolt/logging`

### 4. ESM é o padrão

O workspace está padronizado em ESM (`type: module`) nos apps Node e nos pacotes compartilhados. Isso significa:

- usar `import` e `export`;
- evitar `require` em novos arquivos;
- manter consistência entre root, apps e packages.

### 5. Scripts têm papéis diferentes

- `dev`: desenvolvimento local com reload ou watch quando aplicável;
- `start`: execução normal do processo;
- `deploy`: publicação, geração de comandos ou tarefas que não precisam subir continuamente.

## Apps Em `apps/`

### `apps/backend`

API HTTP principal do BeeVolt.

Responsabilidades:

- expor endpoints REST para empresas e colaboradores;
- montar o Express em `app.js`;
- subir o servidor em `server.js`;
- organizar regras por domínio em `modules/`.

Estrutura típica:

- `modules/companies`: rotas, controller, service e repository de empresas;
- `modules/employees`: rotas, controller, service e repository de colaboradores;
- `modules/shared`: erros e utilitários comuns.

Esse app é o ponto central para dados operacionais do sistema.

### `apps/beea-bot`

Bot do Discord da BeeVolt.

Responsabilidades:

- iniciar o cliente Discord;
- expor um pequeno servidor HTTP interno para integração e health checks;
- carregar comandos de forma automática;
- publicar comandos na aplicação do Discord quando necessário.

Estrutura principal:

- `src/bot.js`: bootstrap e login do bot;
- `src/server.js`: servidor HTTP do bot;
- `src/loaders/command-loader.js`: descoberta dos comandos;
- `src/commands/`: comandos do bot;
- `src/routes/internal.routes.js`: rotas internas;
- `src/deploy-commands.js`: sincronização dos comandos com o Discord.

### `apps/crm-sheets`

Integração do CRM com Google Sheets e Google Apps Script.

Responsabilidades:

- oferecer a fachada pública em `src/appscript/app.gs`;
- organizar a lógica por controller, service, repository e domain;
- renderizar a interface HTML do formulário;
- manter triggers de abertura, edição e tarefas agendadas;
- sincronizar empresas, colaboradores e follow-ups.

Estrutura relevante:

- `config/`: constantes e contexto da planilha;
- `controllers/`: entrada pública do domínio;
- `services/`: regras de negócio;
- `repositories/`: leitura e escrita nas planilhas;
- `domain/`: conversão de payloads e linhas;
- `ui/`: diálogo e formulário HTML;
- `triggers/`: `onOpen`, `onEdit` e tarefas agendadas.

Esse app não é um processo Node tradicional. Ele é empacotado e executado dentro do ambiente do Apps Script.

## Packages Em `packages/`

### `packages/database`

Camada de persistência compartilhada.

Hoje concentra a infraestrutura de acesso a dados usada por outros apps do workspace.

### `packages/logging`

Camada de logging compartilhada.

Centraliza saída para console e integrações opcionais de observabilidade, evitando acoplamento direto entre apps.

## Como Navegar Pelo Código

Se você está entrando agora no projeto, uma boa ordem de leitura é:

1. `package.json` da raiz para entender os scripts do monorepo.
2. `main.js` para ver como os apps são lançados.
3. `apps/backend` para a API principal.
4. `apps/beea-bot` para o bot e seus comandos.
5. `apps/crm-sheets/src/appscript/ARCHITECTURE.md` para a arquitetura interna do Apps Script.
6. `packages/database` e `packages/logging` para os módulos compartilhados.

## Como Rodar

Os scripts do root delegam a execução para os apps que tiverem o modo solicitado.

- `npm run dev`
- `npm start`
- `npm run deploy`

Dependendo do app, o modo pode iniciar um servidor, um watcher, um bot, ou uma tarefa de publicação.

## Contribuindo

Ao adicionar algo novo, tente seguir estas regras:

- prefira criar código novo dentro do app correto, em vez de espalhar lógica pela raiz;
- coloque código compartilhado em `packages/`;
- mantenha nomes de arquivos e pastas coerentes com a responsabilidade da camada;
- preserve contratos públicos sempre que possível, especialmente APIs usadas por integrações externas e planilhas.

Se a mudança afetar comportamento externo, documente o impacto no próprio app antes de concluir a implementação.

## Resumo Rápido

- `backend`: API HTTP do sistema.
- `beea-bot`: bot do Discord e integrações internas.
- `crm-sheets`: camada Google Apps Script para o CRM em planilhas.
- `packages/database`: persistência compartilhada.
- `packages/logging`: logging compartilhado.

Se você tiver que entender o projeto em pouco tempo, comece pelo root, depois siga para o app que vai mexer e leia os arquivos de arquitetura daquele app antes de editar código.
