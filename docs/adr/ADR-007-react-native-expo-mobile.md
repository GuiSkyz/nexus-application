# ADR-007: React Native com Expo como Aplicação Mobile de Campo

## Status
Aceito

## Contexto
O aplicativo móvel do NexusOps será manuseado intensamente em campo, por equipes técnicas multimarcas portando celulares de diferentes especificações em ambientes de sol, poeira e conectividade intermitente para tirar fotos, preencher checklists de APR e colher assinaturas em tela.

## Decisão
O aplicativo móvel oficial em `apps/mobile` será construído em **React Native orquestrado pela plataforma Expo (com Managed Workflow e TypeScript estrito)**.

## Consequências
- **Positivas:** Compartilhamento de tipagens do domínio e de utilitários com o ecossistema TypeScript do projeto web; acesso robusto a APIs nativas de câmera, sistema de arquivos em cache para fotos offline e biometria/assinatura digital via módulos consolidados do Expo sem complexidade de builds de código nativo (C++/Java/Swift); atualizações em tempo real (OTA) simplificadas para correções urgentes em campo.
- **Negativas:** Dependência do ciclo de vida e das atualizações de versão do SDK do Expo.
