# Regra Geral de Atualização e Entrega

**Descrição:** Instrução obrigatória para todos os agentes de IA operando neste repositório.

**Objetivo:** Garantir que toda alteração seja validada localmente e enviada com segurança por meio de uma branch de trabalho, sem modificar diretamente a branch `main`.

## Regras de Segurança Git

O agente NÃO DEVE:

* Trabalhar diretamente na branch `main`.
* Fazer commit diretamente na branch `main`.
* Executar `git push origin main`.
* Fazer merge automaticamente.
* Excluir branches sem autorização.
* Usar `git push --force`.
* Alterar arquivos fora do escopo da tarefa sem necessidade.

Antes de modificar qualquer arquivo, o agente deve verificar a branch atual:

```bash
git branch --show-current
```

Se a branch atual for `main`, o agente deve criar uma nova branch antes de continuar:

```bash
git switch -c feat/nome-descritivo
```

Para correções:

```bash
git switch -c fix/nome-descritivo
```

Para refatorações:

```bash
git switch -c refactor/nome-descritivo
```

O nome da branch deve ser curto, descritivo e escrito em kebab-case.

Exemplos:

```text
feat/tela-conferencia-epi
fix/erro-login
refactor/servico-notificacoes
```

# Fluxo Obrigatório Pós-Atualização

Sempre que o agente concluir uma tarefa que envolva modificação de código, adição de feature, correção de bug, refatoração ou alteração de configuração, ele deve executar todo o fluxo abaixo antes de finalizar a interação.

## 1. Revisão das Alterações

Verificar os arquivos alterados:

```bash
git status
git diff
```

O agente deve confirmar que:

* Apenas arquivos relacionados à tarefa foram modificados.
* Nenhuma credencial, chave, token ou arquivo sensível foi adicionado.
* Nenhum arquivo de ambiente foi incluído indevidamente.
* Não existem alterações acidentais ou fora do escopo.

## 2. Linting e Tipagem

Executar as verificações correspondentes às pastas alteradas.

### API

```bash
ruff check .
mypy .
```

### Web ou Mobile

```bash
npm run lint
npx tsc --noEmit
```

Quando o repositório possuir múltiplos projetos, os comandos devem ser executados dentro da pasta correspondente.

Exemplos:

```bash
cd api
ruff check .
mypy .
```

```bash
cd web
npm run lint
npx tsc --noEmit
```

```bash
cd mobile
npm run lint
npx tsc --noEmit
```

## 3. Testes

Executar a suíte de testes correspondente à área alterada.

### API

```bash
pytest
```

### Web ou Mobile

Executar o script de testes disponível no respectivo `package.json`.

Exemplo:

```bash
npm test
```

ou:

```bash
npm run test
```

Caso o projeto não possua testes configurados, o agente deve informar isso claramente no relatório final. A ausência de testes não deve ser ocultada.

## 4. Build

Executar o build de produção quando aplicável.

### Web

```bash
npm run build
```

### Mobile

Quando existir um script local de build ou validação específico, executá-lo.

O agente NÃO deve iniciar builds remotos, publicar aplicativos ou realizar deploy sem autorização explícita.

## 5. Tratamento de Falhas

Se qualquer etapa de linting, tipagem, testes ou build falhar, o agente deve:

1. Interromper o fluxo de commit.
2. Identificar a causa do erro.
3. Corrigir o problema, desde que esteja relacionado à tarefa.
4. Reiniciar toda a sequência de validação desde o início.
5. Não fazer commit ou push enquanto houver erros.

Caso o erro já existisse antes da alteração e não tenha relação com a tarefa, o agente deve:

* Não ocultar o erro.
* Informar exatamente qual comando falhou.
* Explicar por que o problema aparenta ser preexistente.
* Não alterar partes não relacionadas do sistema apenas para forçar a validação a passar.
* Não fazer commit ou push automaticamente sem autorização.

## 6. Commit

Somente depois que todas as validações aplicáveis forem concluídas com sucesso, o agente poderá preparar o commit:

```bash
git add .
```

Antes de confirmar o commit, o agente deve revisar:

```bash
git diff --cached
```

A mensagem deve seguir o padrão Conventional Commits:

```text
feat: adiciona tela de conferência de EPI
fix: corrige validação do formulário
refactor: reorganiza serviço de notificações
docs: atualiza instruções do projeto
chore: atualiza configuração de lint
```

Exemplo:

```bash
git commit -m "feat: adiciona tela de conferência de EPI"
```

O agente não deve usar mensagens genéricas como:

```text
update
changes
ajustes
fix
commit final
```

## 7. Push da Branch

Após o commit, o agente pode enviar exclusivamente a branch atual:

```bash
git push -u origin HEAD
```

O agente nunca deve executar:

```bash
git push origin main
```

O comando `git push -u origin HEAD` deve ser preferido porque envia a branch atual sem precisar repetir ou deduzir manualmente seu nome.

## 8. Pull Request e Merge

Após enviar a branch, o agente deve informar que ela está pronta para criação ou revisão de um Pull Request.

O agente NÃO deve:

* Fazer merge na `main`.
* Aprovar o próprio Pull Request.
* Fazer merge automático.
* Encerrar ou excluir a branch.
* Publicar em produção.

O merge deve depender de revisão e autorização humana.

## Relatório Final Obrigatório

Ao finalizar a tarefa, o agente deve apresentar um resumo contendo:

* Branch utilizada.
* Arquivos principais alterados.
* Descrição resumida da implementação.
* Comandos de validação executados.
* Resultado do lint.
* Resultado da verificação TypeScript ou mypy.
* Resultado dos testes.
* Resultado do build.
* Hash ou mensagem do commit, caso tenha sido criado.
* Situação do push.
* Pendências ou erros encontrados.
* Orientação para criar e revisar o Pull Request.

Exemplo:

```text
Branch: feat/tela-conferencia-epi

Validações:
- npm run lint: aprovado
- npx tsc --noEmit: aprovado
- npm test: aprovado
- npm run build: aprovado

Commit:
feat: adiciona tela de conferência de EPI

Push:
Branch enviada para origin/feat/tela-conferencia-epi

Próximo passo:
Criar um Pull Request da branch feat/tela-conferencia-epi para a branch main.
```

# Princípio Fundamental

A branch `main` representa a versão estável e oficial do sistema.

Toda alteração deve seguir este fluxo:

```text
Criar branch
→ Alterar código
→ Revisar mudanças
→ Executar lint e tipagem
→ Executar testes
→ Executar build
→ Criar commit
→ Enviar a branch
→ Criar Pull Request
→ Revisar
→ Fazer merge manual
```

Nenhum agente está autorizado a ignorar esse fluxo ou enviar alterações diretamente para a `main`.
