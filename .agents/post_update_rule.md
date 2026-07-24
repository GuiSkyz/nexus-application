# Regra Geral de Atualização (Post-Update Rule)

**Descrição:** Instrução obrigatória para todos os agentes de IA operando neste repositório.

**Gatilho:** Sempre que você (o agente) concluir uma tarefa de atualização de código (modificação de arquivos fonte, adição de features, correção de bugs, etc.), você DEVE obrigatoriamente executar o seguinte fluxo antes de finalizar sua interação com o usuário:

## Fluxo Obrigatório (CI Local do Agente)

1. **Linting e Tipagem:**
   - Execute o linter correspondente à pasta alterada:
     - API: `ruff check .` e `mypy .`
     - Web/Mobile: `npm run lint` e verificação do TypeScript (`npx tsc --noEmit`).

2. **Testes (Verificação de Correção):**
   - Execute a suíte de testes unitários para garantir que nenhuma regressão foi introduzida:
     - API: `pytest`

3. **Build:**
   - Teste o build de produção (para garantir compilação com sucesso):
     - Web: `npm run build`

4. **Commit e Push:**
   - Se, e somente se, todos os passos acima passarem sem erros:
     - Adicione as mudanças: `git add .`
     - Faça o commit com uma mensagem descritiva (Padrão Conventional Commits): `git commit -m "feat/fix: descrição da mudança"`
     - Envie para a branch principal: `git push origin main`

> Se qualquer um dos passos 1, 2 ou 3 falhar, você DEVE interromper o fluxo, corrigir o erro encontrado, e reiniciar a sequência de validação do zero antes de realizar o commit.
