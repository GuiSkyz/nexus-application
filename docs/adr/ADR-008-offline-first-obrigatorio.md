# ADR-008: Obrigatoriedade do Paradigma Offline-First no Mobile

## Status
Aceito

## Contexto
Técnicos de instalação e manutenção de fibra/internet ISP comumente entram em áreas sem sinal de telefonia/4G (ex: subsolos, edifícios selados ou zonas rurais distantes). Se a aplicação móvel depender de requisições de rede síncronas para validar checklists ou salvar vistorias, a operação de campo travará, violando a utilidade do NexusOps.

## Decisão
Fica determinado que **o aplicativo móvel adote o padrão Offline-First de forma nativa e obrigatória**:
1. O banco de dados local do celular (AsyncStorage/SQLite) é a fonte de verdade imediata do usuário do mobile.
2. Identificadores únicos para novos recursos (`UUIDv4`) são **gerados no cliente (mobile)** no instante da criação, garantindo idempotência e prevenindo colisões no servidor.
3. Todas as alterações em campo entram em uma fila assíncrona local que concilia e faz o upload (fotos + JSON) automaticamente assim que a conectividade de rede for restaurada ou detectada.

## Consequências
- **Positivas:** Operação ininterrupta em campo para os técnicos independentemente das condições externas; responsividade instantânea do aplicativo sem spinners ou esperas de resposta do servidor no momento do preenchimento.
- **Negativas:** Exige lógica mais elaborada de máquina de estados (`PENDING`, `SYNCING`, `SYNCED`, `ERROR`) e reconciliação de concorrência na sincronização no backend.
