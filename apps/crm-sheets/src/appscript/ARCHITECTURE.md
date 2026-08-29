# BeeVolt CRM Apps Script Architecture

Este diretório foi reorganizado para expor uma única fachada pública em `app.gs`.
Os arquivos antigos monolíticos deixaram de ser usados como entrypoint.

## Estrutura

- `app.gs`
  - Fachada pública do projeto.
  - Expõe apenas as funções que podem ser chamadas pela UI, menus, triggers ou `google.script.run`.
- `config/`
  - `constants.gs`: nomes de abas, modos, tipos de contexto e listas fixas.
  - `configuration.gs`: leitura e gravação do contexto da instância ativa.
- `controllers/`
  - Adaptam a intenção da interface para chamadas de serviço.
  - São o ponto público usado por `app.gs`.
- `services/`
  - Regras de negócio, validação e orquestração entre repositórios.
- `repositories/`
  - Acesso às planilhas e persistência.
- `domain/`
  - Normalização e conversão entre payloads, linhas da planilha e objetos de domínio.
- `utils/`
  - Funções auxiliares reutilizáveis.
- `ui/`
  - HTML e helpers de diálogo.
- `triggers/`
  - `onOpen`, `onEdit` e execução agendada.

## Fluxo Público

1. A UI chama apenas funções expostas por `app.gs`.
2. `app.gs` encaminha a chamada para o controller correspondente.
3. O controller delega para o service.
4. O service valida, aplica regras e chama o repositório.
5. O repositório lê ou escreve na planilha.

## Contexto Da Planilha

O projeto trabalha com dois contextos:

- `MAIN`
  - Planilha principal.
  - Permite atribuir responsáveis.
- `USER`
  - Planilha por usuário.
  - O responsável é fixo no contexto atual.

O contexto é resolvido por `Configuration.getContext()`.
Ele primeiro tenta ler uma configuração persistida no `ScriptProperties` e, se não houver, infere pelo nome da planilha.

## Empresas

O fluxo de empresas foi dividido assim:

- `CompanyController`
  - `add`, `edit`, `get`, `list`, `refresh`, `openAddDialog`, `openEditDialog`
- `CompanyService`
  - Regras de criação, edição parcial, leitura e montagem do contexto do formulário.
- `CompanyRepository`
  - Leitura e gravação da aba de empresas.

### Atualização Parcial

O `update` de empresas aceita apenas os campos enviados.
Campos ausentes não são limpos.
Isso preserva o comportamento dos consumidores legados e evita sobrescrita acidental.

### Diálogo de Edição

O diálogo de edição usa a linha selecionada na aba de empresas.
Se não houver linha válida, a interface recebe um alerta e a abertura é abortada.

## Follow-ups

Os follow-ups foram isolados em:

- `FollowUpController`
- `FollowUpService`
- `FollowUpRepository`

O serviço decide o próximo estado, inicializa o primeiro follow-up e processa pendências automáticas.

## Como Adicionar Uma Nova Função

1. Crie a regra em `services/` ou `repositories/`, conforme o caso.
2. Exponha a operação no controller.
3. Reexporte no `app.gs` se a função precisar ser pública.
4. Se a função for usada pela interface, atualize o HTML correspondente.

## Boas Práticas

- Prefira dados normalizados no `domain/`.
- Mantenha validação no `services/`.
- Não acople observabilidade ou UI ao repositório.
- Preserve formatos de resposta usados pela UI e pelos consumidores legados enquanto a migração estiver em andamento.
