# Implementation Plan: API de Reservas TechNova

## Overview

Implementação completa de uma API REST Node.js/Express com persistência em PostgreSQL, containerização via Docker/Docker Compose e infraestrutura AWS provisionada com Terraform modularizado. O plano cobre desenvolvimento da aplicação, Docker, IaC, coleta de evidências e documentação, garantindo rastreabilidade entre tasks e requisitos.

---

## Tasks

### Fase 1 — Configuração e Segurança Base

- [ ] 1. Configurar repositório e arquivos de ambiente
  - [ ] 1.1 Atualizar `.gitignore` adicionando os padrões ausentes: `terraform.tfvars`, `*.tfstate.backup` (se não coberto por `*.tfstate.*`), `*.log`
    - Verificar que `.env`, `*.tfstate`, `*.tfstate.*`, `.terraform/`, `*.pem` já estão presentes
    - _Requirements: 17.2, 10.7_
  - [ ] 1.2 Criar `.env.example` na raiz do projeto com todas as variáveis de ambiente necessárias e valores de placeholder não-sensíveis
    - Variáveis: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `PORT`
    - Exemplo de valores: `DB_PASSWORD=example_password`, `DB_HOST=db`, `PORT=3000`
    - _Requirements: 10.6, 17.3, 8.2_

- [ ] 2. Commit: configuração inicial
  - Executar commit Conventional Commits após aprovação explícita do usuário
  - Formato sugerido: `chore: configura gitignore e env.example`
  - _Requirements: 18.1, 18.2_

---

### Fase 2 — Aplicação Node.js/Express

- [ ] 3. Implementar módulo de validações — `app/src/validators/reserva.js`
  - [ ] 3.1 Criar arquivo `app/src/validators/reserva.js` com as funções helper de validação
    - `isClienteValido(cliente)`: string não vazia, máximo 255 caracteres
    - `isDataValida(data)`: string no formato `YYYY-MM-DD` e data válida
    - `isStatusValido(status)`: um de `pendente`, `confirmada`, `cancelada`
    - `isIdValido(id)`: inteiro positivo
    - `validateEnvVars(keys)`: verifica variáveis obrigatórias, encerra processo com `exit(1)` se ausentes
    - Exportar também a constante `STATUS_VALIDOS`
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 4.3, 5.6, 6.3, 8.4_
  - [ ]* 3.2 Escrever testes unitários para os helpers de validação
    - Testar cada função com casos válidos e inválidos
    - Incluir edge cases: string vazia, null, undefined, 256 chars, datas inválidas (ex: `2025-13-01`)
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 4.3_

- [ ] 4. Implementar pool de conexão e criação de tabela — `app/src/db/index.js`
  - [ ] 4.1 Criar arquivo `app/src/db/index.js` com pool `pg` e função `checkDbConnection`
    - Criar instância `Pool` usando variáveis de ambiente (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`)
    - Implementar `checkDbConnection(timeoutMs = 10_000)` usando `Promise.race` com timeout
    - Implementar criação automática da tabela `reservas` no startup com `CREATE TABLE IF NOT EXISTS`
    - DDL deve incluir: `id SERIAL PRIMARY KEY`, `cliente VARCHAR(255) NOT NULL`, `data DATE NOT NULL`, `status VARCHAR(50) NOT NULL CHECK (status IN ('pendente','confirmada','cancelada'))`
    - Exportar `{ pool, checkDbConnection }`
    - _Requirements: 1.1, 1.2, 1.3_

- [ ] 5. Implementar controller — `app/src/controllers/reservasController.js`
  - [ ] 5.1 Criar arquivo `app/src/controllers/reservasController.js` com todas as operações CRUD
    - Implementar helper `formatReserva(row)` para serializar campo `data` como `YYYY-MM-DD`
    - Implementar helper `withDbErrorHandling(res, fn)` para capturar erros de conexão e retornar 503
    - Detectar erros de DB por `err.code === 'ECONNREFUSED'`, `err.code === 'ENOTFOUND'` ou `err.message.includes('timeout')`
    - `criarReserva(req, res)`: valida campos → insere → retorna 201 com objeto criado
    - `listarReservas(req, res)`: busca todas → retorna 200 com array (vazio se sem dados)
    - `buscarReservaPorId(req, res)`: valida id → busca → 200 ou 404 ou 400
    - `atualizarReserva(req, res)`: valida id e campos → query dinâmica → 200 ou 404 ou 400
    - `excluirReserva(req, res)`: valida id → deleta → 200 com mensagem ou 404 ou 400
    - Todas as respostas de erro seguem o padrão `{ "erro": "mensagem" }`
    - _Requirements: 2.1–2.6, 3.1–3.3, 4.1–4.4, 5.1–5.6, 6.1–6.4_
  - [ ]* 5.2 Escrever testes de propriedade para o controller (Property 1: round-trip)
    - **Property 1: Round-trip de criação e busca por ID**
    - **Validates: Requirements 1.1, 2.1, 4.1**
    - Usar `fc.string`, `fc.date`, `fc.constantFrom` conforme definido no design
    - `numRuns: 100`

- [ ] 6. Implementar rotas — `app/src/routes/reservas.js`
  - [ ] 6.1 Criar arquivo `app/src/routes/reservas.js` com os 5 endpoints conectados ao controller
    - `POST /` → `criarReserva`
    - `GET /` → `listarReservas`
    - `GET /:id` → `buscarReservaPorId`
    - `PUT /:id` → `atualizarReserva`
    - `DELETE /:id` → `excluirReserva`
    - Exportar `router` do Express
    - _Requirements: 2.1, 3.1, 4.1, 5.1, 6.1_

- [ ] 7. Criar entry point — `app/src/index.js`
  - [ ] 7.1 Criar arquivo `app/src/index.js` seguindo a ordem de inicialização definida no design
    - Primeira linha: `require('dotenv').config()`
    - Chamar `validateEnvVars(['DB_HOST','DB_PORT','DB_USER','DB_PASSWORD','DB_NAME'])`
    - Montar Express com `express.json()`, montar rotas `/reservas` e `/health`
    - Rota `GET /health`: chamar `checkDbConnection()`, retornar `{ status: 'ok', timestamp }` (200) ou `{ status: 'error', mensagem }` (503)
    - Função `start()` assíncrona: `checkDbConnection(10_000)` → `app.listen(PORT)` ou `process.exit(1)` com log de erro
    - _Requirements: 1.2, 1.3, 7.1, 7.2, 7.3, 8.1, 8.3, 8.4_

- [ ] 8. Atualizar `app/package.json` com scripts e dependências de teste
  - [ ] 8.1 Adicionar script `"start": "node src/index.js"` ao `package.json`
  - [ ] 8.2 Atualizar script `"test"` para `"jest --runInBand"`
  - [ ] 8.3 Instalar dependências de desenvolvimento: `jest@^29`, `supertest@^7`, `fast-check@^3`
    - Executar: `npm install --save-dev jest supertest fast-check` dentro de `app/`
  - [ ] 8.4 Criar `app/jest.config.js` com `testEnvironment: 'node'` e `testTimeout: 30000`
    - _Requirements: 8.1_

- [ ] 9. Commit: implementação da aplicação
  - Executar commit Conventional Commits após aprovação explícita do usuário
  - Formato sugerido: `feat(app): implementa CRUD de reservas com PostgreSQL`
  - _Requirements: 18.1, 18.2_

- [ ] 10. Escrever suite de testes automatizados — `app/src/__tests__/`
  - [ ] 10.1 Criar `app/src/__tests__/exemplos.test.js` com testes de exemplo (Jest + Supertest)
    - GET `/reservas` com banco vazio → `[]` e status 200
    - GET `/health` com DB disponível → status 200, `body.status === 'ok'`, `body.timestamp` em ISO 8601
    - GET `/health` com DB indisponível → status 503, `body.status === 'error'`
    - POST com body válido → 201 com `id` numérico
    - POST com `cliente` vazio → 400
    - POST com `data` inválida → 400
    - POST com `status` inválido → 400
    - GET `/reservas/:id` com id inexistente → 404
    - GET `/reservas/:id` com id inválido (letra) → 400
    - DELETE com id existente → 200 com mensagem
    - _Requirements: 2.1–2.5, 3.1–3.2, 4.1–4.3, 6.1–6.3, 7.1–7.2_
  - [ ]* 10.2 Criar `app/src/__tests__/propriedades.test.js` com testes de propriedade (fast-check)
    - **Property 2: DB indisponível retorna 503 em qualquer rota de reservas**
    - **Validates: Requirements 1.4, 2.6, 3.3, 4.4, 6.4**
    - **Property 3: Campos inválidos no POST retornam 400**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5**
    - **Property 4: Listagem retorna todas as reservas inseridas**
    - **Validates: Requirements 3.1**
    - **Property 5: ID não inteiro positivo retorna 400**
    - **Validates: Requirements 4.3, 5.6, 6.3**
    - **Property 6: ID inexistente retorna 404**
    - **Validates: Requirements 4.2, 5.2, 6.2**
    - **Property 7: PUT atualiza somente os campos enviados**
    - **Validates: Requirements 5.1**
    - **Property 8: DELETE + GET = 404 (exclusão permanente)**
    - **Validates: Requirements 6.1**
    - Cada propriedade em teste separado com `numRuns: 100`

- [ ] 11. Checkpoint — Aplicação
  - Garantir que todos os testes passam com `npm test --runInBand`, perguntar ao usuário se há dúvidas antes de continuar.

---

### Fase 3 — Docker

- [ ] 12. Criar arquivos Docker da aplicação
  - [ ] 12.1 Criar `app/.dockerignore` excluindo: `node_modules/`, `.env`, `*.log`, `.git/`
    - _Requirements: 9.3_
  - [ ] 12.2 Criar `app/Dockerfile` multi-stage com dois estágios distintos
    - Estágio `deps` (`node:20-alpine`): copia `package*.json`, executa `npm ci --only=production`
    - Estágio `runner` (`node:20-alpine`): copia `node_modules` do estágio `deps`, copia `src/` e `package.json`, aplica `USER node` (UID 1000), `EXPOSE 3000`, `CMD ["node", "src/index.js"]`
    - _Requirements: 9.1, 9.2_

- [ ] 13. Criar `docker-compose.yml` na raiz do projeto
  - [ ] 13.1 Criar `docker-compose.yml` com os dois serviços `api` e `db`
    - Serviço `db`: imagem `postgres:16-alpine`, variáveis `POSTGRES_DB/USER/PASSWORD` via `${DB_*}`, volume nomeado `technova-pgdata`, rede `technova-network`, healthcheck com `pg_isready` (`interval: 10s`, `timeout: 5s`, `retries: 5`)
    - Serviço `api`: build `./app`, porta `3000:3000`, `env_file: .env`, rede `technova-network`, `depends_on: db: condition: service_healthy`
    - Declarar rede bridge `technova-network` e volume `technova-pgdata` nas seções globais
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 14. Commit: containerização
  - Executar commit Conventional Commits após aprovação explícita do usuário
  - Formato sugerido: `feat(docker): adiciona Dockerfile multi-stage e docker-compose`
  - _Requirements: 18.1, 18.2_

---

### Fase 4 — Terraform: Remote State Backend

- [ ] 15. Criar módulo do Remote State — `infra/backend/`
  - [ ] 15.1 Criar `infra/backend/main.tf` com recursos de backend remoto
    - `provider "aws" { region = "us-east-1" }`
    - `resource "aws_s3_bucket" "tf_state"` com `random_id` no nome para unicidade
    - `resource "aws_s3_bucket_versioning"`: `status = "Enabled"`
    - `resource "aws_s3_bucket_server_side_encryption_configuration"`: `sse_algorithm = "AES256"`
    - `resource "aws_dynamodb_table" "tf_lock"`: `hash_key = "LockID"`, `billing_mode = "PAY_PER_REQUEST"`
    - Adicionar `required_providers` para `hashicorp/random ~> 3.0`
    - _Requirements: 16.1, 16.2_
  - [ ] 15.2 Criar `infra/backend/outputs.tf` expondo `bucket_name` e `dynamodb_table_name`
    - _Requirements: 16.3_
  - [ ] 15.3 Criar `infra/backend/variables.tf` (se necessário para parametrização de nome do projeto)
    - _Requirements: 16.1_

- [ ] 16. Commit: remote state backend
  - Executar commit Conventional Commits após aprovação explícita do usuário
  - Formato sugerido: `infra(backend): configuração do remote state S3+DynamoDB`
  - _Requirements: 18.1, 18.2_

---

### Fase 5 — Terraform: Módulos

- [ ] 17. Criar módulo VPC — `infra/modules/vpc/`
  - [ ] 17.1 Criar `infra/modules/vpc/variables.tf` com variáveis de entrada obrigatórias
    - `vpc_cidr` (string), `project_name` (string), `public_subnet_cidrs` (list(string)), `private_subnet_cidrs` (list(string)), `availability_zones` (list(string))
    - Nenhum valor padrão hardcoded para `vpc_cidr`
    - _Requirements: 11.1_
  - [ ] 17.2 Criar `infra/modules/vpc/main.tf` com todos os recursos de rede
    - `aws_vpc` com `cidr_block = var.vpc_cidr` e `enable_dns_support = true`
    - 2 `aws_subnet` públicas e 2 `aws_subnet` privadas distribuídas entre `us-east-1a` e `us-east-1b` (usar `count` ou `for_each`)
    - `aws_internet_gateway` associado à VPC
    - `aws_route_table` para subnets públicas com rota `0.0.0.0/0` → IGW
    - `aws_route_table_association` para cada subnet pública
    - Tags `Name` e `Project` em todos os recursos usando `var.project_name`
    - _Requirements: 11.1, 11.2, 11.3, 11.5_
  - [ ] 17.3 Criar `infra/modules/vpc/outputs.tf` expondo `vpc_id`, `public_subnet_ids`, `private_subnet_ids`
    - _Requirements: 11.4_

- [ ] 18. Criar módulo Security Group — `infra/modules/security-group/`
  - [ ] 18.1 Criar `infra/modules/security-group/variables.tf` com `vpc_id` e `project_name` como variáveis obrigatórias sem valor padrão
    - _Requirements: 12.4_
  - [ ] 18.2 Criar `infra/modules/security-group/main.tf` com os dois Security Groups criados internamente
    - `aws_security_group.ec2`: ingress porta 3000/TCP de `0.0.0.0/0`, ingress porta 22/TCP de `0.0.0.0/0`, egress all `0.0.0.0/0`
    - `aws_security_group.rds`: ingress porta 5432/TCP `source_security_group_id = aws_security_group.ec2.id`, egress all `0.0.0.0/0`
    - Tags `Name` e `Project` em ambos
    - _Requirements: 12.1, 12.2, 12.3_
  - [ ] 18.3 Criar `infra/modules/security-group/outputs.tf` expondo `sg_ec2_id` e `sg_rds_id`
    - _Requirements: 12.5_

- [ ] 19. Criar módulo EC2 — `infra/modules/ec2/`
  - [ ] 19.1 Criar `infra/modules/ec2/variables.tf` com variáveis de entrada
    - Obrigatórias sem padrão: `vpc_id`, `subnet_id`, `security_group_id`, `ami_id`, `key_name`, `project_name`
    - Com padrão: `instance_type = "t2.micro"`
    - _Requirements: 13.1_
  - [ ] 19.2 Criar `infra/modules/ec2/main.tf` com a instância EC2
    - `aws_instance` com `instance_type = var.instance_type`, `subnet_id = var.subnet_id`, `vpc_security_group_ids = [var.security_group_id]`
    - `associate_public_ip_address = true`
    - `iam_instance_profile = "LabInstanceProfile"` (sem criar nenhum recurso IAM)
    - Tags `Name` e `Project`
    - _Requirements: 13.2, 13.3, 13.4, 13.5, 13.7_
  - [ ] 19.3 Criar `infra/modules/ec2/outputs.tf` expondo `ec2_public_ip`
    - _Requirements: 13.6_

- [ ] 20. Criar módulo RDS — `infra/modules/rds/`
  - [ ] 20.1 Criar `infra/modules/rds/variables.tf` com variáveis de entrada obrigatórias
    - `db_subnet_ids` (list(string)), `security_group_id` (string), `db_name` (string), `db_username` (string), `db_password` (string, sensitive), `project_name` (string)
    - _Requirements: 14.1_
  - [ ] 20.2 Criar `infra/modules/rds/main.tf` com `aws_db_subnet_group` e `aws_db_instance`
    - `aws_db_subnet_group` criado pelo próprio módulo usando `var.db_subnet_ids`
    - `aws_db_instance`: engine `postgres`, engine_version `"16"`, instance_class `"db.t3.micro"`, `publicly_accessible = false`, `storage_encrypted = true`, `skip_final_snapshot = true`
    - Associar `var.security_group_id` via `vpc_security_group_ids`
    - Tags `Name` e `Project`
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.7_
  - [ ] 20.3 Criar `infra/modules/rds/outputs.tf` expondo `rds_endpoint`
    - _Requirements: 14.6_

- [ ] 21. Commit: módulos Terraform
  - Executar commits Conventional Commits após aprovação explícita do usuário (pode ser um commit por módulo ou um único)
  - Formato sugerido: `infra(modules): implementa módulos vpc, sg, ec2 e rds`
  - _Requirements: 18.1, 18.2_

---

### Fase 6 — Terraform: Raiz

- [ ] 22. Criar arquivos raiz do Terraform — `infra/`
  - [ ] 22.1 Criar `infra/providers.tf` configurando o provider AWS e o bloco backend comentado
    - `provider "aws" { region = var.aws_region }`
    - Bloco `backend "s3"` comentado com placeholders: `<BUCKET_NAME>`, `key = "technova/terraform.tfstate"`, `region = "us-east-1"`, `dynamodb_table = "technova-tf-lock"`, `encrypt = true`
    - `required_providers`: `hashicorp/aws ~> 5.0`
    - _Requirements: 15.4, 16.3_
  - [ ] 22.2 Criar `infra/variables.tf` com todas as variáveis declaradas
    - `aws_region` (string, default `"us-east-1"`), `vpc_cidr` (string), `project_name` (string), `db_username` (string), `db_password` (string, sensitive = true), `key_name` (string), `ami_id` (string)
    - _Requirements: 15.2_
  - [ ] 22.3 Criar `infra/main.tf` compondo os quatro módulos com encadeamento de outputs → inputs
    - `module "vpc"`: recebe `vpc_cidr`, `project_name`, CIDRs e AZs hardcoded conforme design
    - `module "security_group"`: recebe `vpc_id = module.vpc.vpc_id`, `project_name`
    - `module "ec2"`: recebe `vpc_id`, `subnet_id = module.vpc.public_subnet_ids[0]`, `security_group_id = module.security_group.sg_ec2_id`, `ami_id`, `key_name`, `project_name`
    - `module "rds"`: recebe `db_subnet_ids = module.vpc.private_subnet_ids`, `security_group_id = module.security_group.sg_rds_id`, `db_name`, `db_username`, `db_password`, `project_name`
    - _Requirements: 15.1_
  - [ ] 22.4 Criar `infra/outputs.tf` expondo `ec2_public_ip`, `rds_endpoint` e `api_url`
    - `api_url = "http://${module.ec2.ec2_public_ip}:3000"`
    - _Requirements: 15.3_

- [ ] 23. Commit: composição Terraform raiz
  - Executar commit Conventional Commits após aprovação explícita do usuário
  - Formato sugerido: `infra(root): compõe módulos em infra/main.tf e adiciona providers/variables/outputs`
  - _Requirements: 18.1, 18.2_

---

### Fase 7 — Validação e Coleta de Evidências

- [ ] 24. Coletar evidências Docker
  - [ ] 24.1 Executar `docker build` e salvar saída em `evidencias/01-docker-build.txt`
    - Comando: `docker build -t technova-api ./app 2>&1 | tee evidencias/01-docker-build.txt`
    - Critério: arquivo contém `Successfully built` ou `naming to docker.io`
    - _Requirements: 19.1_
  - [ ] 24.2 Executar `docker compose up -d` e `docker compose ps`, salvar em `evidencias/02-docker-compose-up.txt` e `evidencias/02-docker-compose-ps.txt`
    - Critério: ambos os serviços `api` e `db` com estado `running`/`healthy`
    - _Requirements: 19.2_

- [ ] 25. Coletar evidências dos testes CRUD via curl
  - [ ] 25.1 POST `/reservas` → `evidencias/03-curl-post-reserva.txt` (HTTP 201)
    - _Requirements: 19.3_
  - [ ] 25.2 GET `/reservas` → `evidencias/04-curl-get-reservas.txt` (HTTP 200)
    - _Requirements: 19.3_
  - [ ] 25.3 GET `/reservas/1` → `evidencias/05-curl-get-reserva-id.txt` (HTTP 200)
    - _Requirements: 19.3_
  - [ ] 25.4 PUT `/reservas/1` → `evidencias/06-curl-put-reserva.txt` (HTTP 200)
    - _Requirements: 19.3_
  - [ ] 25.5 DELETE `/reservas/1` → `evidencias/07-curl-delete-reserva.txt` (HTTP 200)
    - _Requirements: 19.3_
  - [ ] 25.6 GET `/health` → `evidencias/08-curl-health.txt` (HTTP 200)
    - _Requirements: 19.3_

- [ ] 26. Coletar evidências Terraform (local)
  - [ ] 26.1 Executar `terraform fmt -check` no diretório `infra/` (exit code 0)
    - Se necessário corrigir formatação com `terraform fmt` antes
    - _Requirements: 15.5_
  - [ ] 26.2 Executar `terraform init` e `terraform validate`, salvar em `evidencias/09-terraform-validate.txt`
    - Critério: contém `Success! The configuration is valid.`
    - _Requirements: 15.6, 19.4_
  - [ ]* 26.3 Executar `terraform plan`, salvar em `evidencias/10-terraform-plan.txt`
    - Critério: exit code 0, contém resumo de recursos a criar
    - _Requirements: 19.4_

- [ ] 27. Commit: evidências locais
  - Executar commit Conventional Commits após aprovação explícita do usuário
  - Formato sugerido: `docs: adiciona evidencias de build docker e validacao terraform`
  - _Requirements: 18.1, 18.2_

- [ ] 28. Coletar evidências AWS (requer `terraform apply` executado manualmente)
  - [ ]* 28.1 Testar `GET /health` na EC2, salvar em `evidencias/11-ec2-health.txt`
    - Critério: contém `"status":"ok"` e `HTTP 200`
    - _Requirements: 19.5_
  - [ ]* 28.2 Executar `terraform show`, salvar em `evidencias/12-terraform-show-rds.txt`
    - Critério: contém estado `available` para `aws_db_instance`
    - _Requirements: 19.6_
  - [ ]* 28.3 Executar `terraform destroy -auto-approve`, salvar em `evidencias/13-terraform-destroy.txt`
    - Critério: contém `Destroy complete! Resources: N destroyed.`
    - _Requirements: 19.7_

---

### Fase 8 — Documentação Final

- [ ] 29. Criar `relatorio.md` na raiz do projeto
  - [ ] 29.1 Criar `relatorio.md` com as quatro seções obrigatórias
    - Seção 1: Visão Geral do Projeto (escopo, tecnologias, arquitetura)
    - Seção 2: Processo de Desenvolvimento (uso da Spec: como Requirements, Design e Tasks guiaram as decisões)
    - Seção 3: Desafios e Soluções (dificuldades encontradas e como foram resolvidas)
    - Seção 4: Conclusão (aprendizados e resultados)
    - _Requirements: 20.1, 20.2_

- [ ] 30. Commit final: documentação
  - Executar commit Conventional Commits após aprovação explícita do usuário
  - Formato sugerido: `docs: adiciona relatorio.md com reflexao sobre o projeto`
  - _Requirements: 18.1, 18.2_

- [ ] 31. Checkpoint Final
  - Verificar que o repositório tem no mínimo 6 commits no branch `feature/prova-primeiro-bimestre` com prefixos Conventional Commits
  - Verificar que todos os Requirements têm ao menos uma Task correspondente
  - Perguntar ao usuário se há ajustes antes de considerar o projeto concluído.
  - _Requirements: 18.1, 20.3_

---

## Notes

- Tasks marcadas com `*` são opcionais e podem ser puladas para uma entrega mais rápida
- As Tasks de evidências AWS (28.x) dependem do provisionamento manual com `terraform apply` — não são executáveis por agente de codificação
- **Nenhum commit deve ser executado sem confirmação explícita do usuário** (Requirement 18.2)
- O Remote State (Fase 4) deve ser aplicado **antes** de descomentar o bloco `backend "s3"` em `providers.tf` (Requirement 16.4)
- O arquivo `terraform.tfvars` nunca deve ser rastreado pelo Git; adicionar ao `.gitignore`
- Todas as referências de módulo seguem o padrão do design: SG cria EC2 e RDS internamente, sem receber `sg_ec2_id` como input

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["3.1", "8.1", "8.2"] },
    { "id": 2, "tasks": ["3.2", "4.1", "8.3", "8.4"] },
    { "id": 3, "tasks": ["5.1", "15.1"] },
    { "id": 4, "tasks": ["5.2", "6.1", "15.2", "15.3"] },
    { "id": 5, "tasks": ["7.1", "17.1", "18.1", "19.1", "20.1"] },
    { "id": 6, "tasks": ["10.1", "12.1", "12.2", "17.2", "18.2", "19.2", "20.2"] },
    { "id": 7, "tasks": ["10.2", "13.1", "17.3", "18.3", "19.3", "20.3"] },
    { "id": 8, "tasks": ["22.1", "22.2"] },
    { "id": 9, "tasks": ["22.3"] },
    { "id": 10, "tasks": ["22.4"] },
    { "id": 11, "tasks": ["24.1", "26.1", "26.2"] },
    { "id": 12, "tasks": ["24.2", "26.3"] },
    { "id": 13, "tasks": ["25.1"] },
    { "id": 14, "tasks": ["25.2", "25.3", "25.4", "25.5", "25.6"] },
    { "id": 15, "tasks": ["28.1", "28.2", "29.1"] },
    { "id": 16, "tasks": ["28.3"] }
  ]
}
```
