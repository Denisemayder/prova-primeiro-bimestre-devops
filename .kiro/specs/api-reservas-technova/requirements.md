# Requirements Document

## Introduction

A **API de Reservas TechNova** é um projeto de prova da disciplina de DevOps (2026.2) que demonstra, de ponta a ponta, a construção e operação de uma API REST em Node.js/Express com persistência em PostgreSQL, containerização via Docker/Docker Compose e provisionamento de infraestrutura na AWS usando Terraform modularizado. O projeto cobre o ciclo completo: desenvolvimento, containerização, IaC e coleta de evidências.

---

## Glossary

- **API**: A aplicação Node.js/Express responsável por receber e processar requisições HTTP de gerenciamento de reservas.
- **Reservation**: Entidade de domínio com os campos `id` (serial), `cliente` (varchar 255), `data` (date ISO 8601) e `status` (varchar 50, valores: `pendente`, `confirmada`, `cancelada`).
- **Database**: Instância PostgreSQL que armazena todas as reservas de forma persistente.
- **Container**: Unidade de execução Docker que empacota a API ou o Database.
- **Compose_Stack**: Conjunto de serviços definidos no `docker-compose.yml` (API + Database).
- **Terraform**: Ferramenta de IaC usada para provisionar a infraestrutura AWS.
- **VPC_Module**: Módulo Terraform em `infra/modules/vpc` responsável por criar a VPC, subnets e roteamento.
- **SG_Module**: Módulo Terraform em `infra/modules/security-group` responsável por criar os Security Groups.
- **EC2_Module**: Módulo Terraform em `infra/modules/ec2` responsável por criar a instância EC2.
- **RDS_Module**: Módulo Terraform em `infra/modules/rds` responsável por criar o banco de dados gerenciado PostgreSQL.
- **Remote_Backend**: Configuração de backend S3 + DynamoDB para armazenar o state do Terraform remotamente com locking.
- **LabRole**: IAM Role pré-existente do AWS Academy Learner Lab; não deve ser criada pelo Terraform.
- **Health_Check**: Endpoint GET `/health` que indica a disponibilidade da API.
- **Conventional Commits**: Padrão de mensagens de commit no formato `<type>(<scope>): <description>`, onde type é um dos: `feat`, `fix`, `docs`, `chore`, `infra`, `test`, `refactor`, `style`, `ci`, `perf`.

---

## Requirements

---

### Requirement 1: Persistência de Reservas em PostgreSQL

**User Story:** Como avaliador, quero que todas as reservas sejam armazenadas em PostgreSQL, para que os dados sobrevivam a reinicializações do container e não dependam de armazenamento em memória.

#### Acceptance Criteria

1. WHEN a API recebe qualquer operação de escrita ou leitura de reservas, THE Database SHALL armazenar e recuperar todas as reservas da tabela `reservas` com os campos `id` (serial primary key), `cliente` (varchar(255) not null), `data` (date not null) e `status` (varchar(50) not null).
2. WHEN a API é iniciada, THE API SHALL verificar a conectividade com o Database dentro de um timeout de 10 segundos antes de aceitar requisições.
3. IF a conexão com o Database falhar na inicialização, THEN THE API SHALL registrar no log a causa do erro (mensagem e código de erro) e encerrar o processo com código de saída diferente de zero.
4. IF o Database estiver indisponível após a inicialização bem-sucedida, THEN THE API SHALL retornar status HTTP 503 para qualquer requisição de reservas, sem servir dados em memória como fallback.

---

### Requirement 2: Criação de Reserva (POST /reservas)

**User Story:** Como cliente da API, quero criar uma nova reserva enviando os dados obrigatórios, para que minha reserva seja registrada com um identificador único.

#### Acceptance Criteria

1. WHEN uma requisição POST é enviada para `/reservas` com os campos `cliente` (não vazio, até 255 caracteres), `data` (formato ISO 8601 YYYY-MM-DD) e `status` (um dos valores: `pendente`, `confirmada`, `cancelada`) válidos no corpo JSON, THE API SHALL inserir a reserva no Database e retornar a reserva criada com status HTTP 201, incluindo o `id` gerado pelo Database e todos os campos enviados.
2. IF o campo `cliente` estiver ausente ou vazio no corpo da requisição, THEN THE API SHALL retornar status HTTP 400 com mensagem de erro indicando que `cliente` é obrigatório, sem realizar inserção no Database.
3. IF o campo `data` estiver ausente ou não seguir o formato ISO 8601 (YYYY-MM-DD) no corpo da requisição, THEN THE API SHALL retornar status HTTP 400 com mensagem de erro indicando que `data` é obrigatório e deve seguir o formato YYYY-MM-DD, sem realizar inserção no Database.
4. IF o campo `status` estiver ausente ou contiver um valor fora dos valores permitidos (`pendente`, `confirmada`, `cancelada`), THEN THE API SHALL retornar status HTTP 400 com mensagem de erro indicando que `status` é obrigatório e deve ser um dos valores permitidos, sem realizar inserção no Database.
5. IF o campo `cliente` exceder 255 caracteres no corpo da requisição, THEN THE API SHALL retornar status HTTP 400 com mensagem de erro indicando que `cliente` excede o limite de 255 caracteres, sem realizar inserção no Database.
6. IF o Database estiver indisponível durante o processamento da requisição, THEN THE API SHALL retornar status HTTP 503 com mensagem de erro indicando indisponibilidade do serviço.

---

### Requirement 3: Listagem de Reservas (GET /reservas)

**User Story:** Como cliente da API, quero listar todas as reservas existentes, para que eu possa visualizar o estado atual do sistema.

#### Acceptance Criteria

1. WHEN uma requisição GET é enviada para `/reservas`, THE API SHALL retornar um array JSON com todos os objetos de reserva armazenados no Database — cada objeto contendo ao menos `id`, `cliente`, `data` e `status` — e status HTTP 200.
2. WHEN não existem reservas no Database, THE API SHALL retornar um array JSON vazio (`[]`) e status HTTP 200.
3. IF o Database estiver indisponível quando a requisição GET `/reservas` for processada, THEN THE API SHALL retornar status HTTP 503 com mensagem de erro indicando indisponibilidade do serviço.

---

### Requirement 4: Busca de Reserva por ID (GET /reservas/:id)

**User Story:** Como cliente da API, quero buscar uma reserva específica pelo seu ID, para que eu possa consultar os detalhes de uma reserva individual.

#### Acceptance Criteria

1. WHEN uma requisição GET é enviada para `/reservas/:id` com um `id` numérico existente no Database, THE API SHALL retornar o objeto da reserva correspondente com os campos `id`, `cliente`, `data` e `status` e status HTTP 200.
2. IF o `id` informado não corresponder a nenhuma reserva no Database, THEN THE API SHALL retornar status HTTP 404 com mensagem de erro indicando que a reserva não foi encontrada.
3. IF o `id` informado não for um inteiro positivo válido (ex: letras, negativos), THEN THE API SHALL retornar status HTTP 400 com mensagem de erro indicando que o `id` deve ser um inteiro positivo.
4. IF o Database estiver indisponível quando a requisição for processada, THEN THE API SHALL retornar status HTTP 503 com mensagem de erro indicando indisponibilidade do serviço.

---

### Requirement 5: Atualização de Reserva (PUT /reservas/:id)

**User Story:** Como cliente da API, quero atualizar os dados de uma reserva existente, para que eu possa corrigir ou modificar informações já registradas.

#### Acceptance Criteria

1. WHEN uma requisição PUT é enviada para `/reservas/:id` com um `id` numérico existente e ao menos um dos campos atualizáveis (`cliente`, `data`, `status`) com valores válidos no corpo JSON, THE API SHALL atualizar a reserva no Database e retornar o objeto completo atualizado com status HTTP 200.
2. IF o `id` informado não corresponder a nenhuma reserva no Database, THEN THE API SHALL retornar status HTTP 404 com mensagem de erro indicando que a reserva não foi encontrada.
3. IF o corpo da requisição não contiver nenhum dos campos atualizáveis (`cliente`, `data`, `status`), THEN THE API SHALL retornar status HTTP 400 com mensagem de erro descritiva indicando que ao menos um campo deve ser fornecido.
4. IF o campo `status` estiver presente no corpo e contiver um valor fora dos valores permitidos (`pendente`, `confirmada`, `cancelada`), THEN THE API SHALL retornar status HTTP 400 com mensagem de erro indicando os valores permitidos.
5. IF o campo `data` estiver presente no corpo e não seguir o formato ISO 8601 (YYYY-MM-DD), THEN THE API SHALL retornar status HTTP 400 com mensagem de erro indicando o formato esperado.
6. IF o `id` informado não for um inteiro positivo válido, THEN THE API SHALL retornar status HTTP 400 com mensagem de erro indicando que o `id` deve ser um inteiro positivo.

---

### Requirement 6: Exclusão de Reserva (DELETE /reservas/:id)

**User Story:** Como cliente da API, quero excluir uma reserva pelo seu ID, para que eu possa remover registros desnecessários ou incorretos.

#### Acceptance Criteria

1. WHEN uma requisição DELETE é enviada para `/reservas/:id` com um `id` numérico existente, THE API SHALL remover a reserva do Database e retornar status HTTP 200 com uma mensagem JSON de confirmação indicando que a reserva foi excluída com sucesso.
2. IF o `id` informado não corresponder a nenhuma reserva no Database, THEN THE API SHALL retornar status HTTP 404 com mensagem de erro indicando que a reserva não foi encontrada.
3. IF o `id` informado não for um inteiro positivo válido, THEN THE API SHALL retornar status HTTP 400 com mensagem de erro indicando que o `id` deve ser um inteiro positivo.
4. IF o Database estiver indisponível quando a requisição for processada, THEN THE API SHALL retornar status HTTP 503 com mensagem de erro indicando indisponibilidade do serviço.

---

### Requirement 7: Health Check (GET /health)

**User Story:** Como operador de infraestrutura, quero um endpoint de health check, para que o orquestrador possa verificar a disponibilidade da API antes de rotear tráfego.

#### Acceptance Criteria

1. WHEN uma requisição GET é enviada para `/health`, THE API SHALL retornar status HTTP 200 com um corpo JSON contendo ao menos os campos `status` (com valor `"ok"`) e `timestamp` no formato ISO 8601.
2. WHEN o Database estiver indisponível, THE API SHALL retornar status HTTP 503 no endpoint `/health` com um corpo JSON contendo `status` com valor `"error"` e uma mensagem indicando que o Database não está acessível.
3. THE API SHALL responder ao endpoint `/health` em no máximo 5 segundos sob condições normais de operação.

---

### Requirement 8: Organização do Código da Aplicação

**User Story:** Como desenvolvedor, quero que o código-fonte da API esteja organizado em `app/src/`, para que a estrutura do projeto seja clara e mantenível.

#### Acceptance Criteria

1. THE API SHALL ter todos os arquivos de código-fonte JavaScript localizados no diretório `app/src/`, sem arquivos `.js` soltos na raiz de `app/`.
2. THE API SHALL utilizar variáveis de ambiente para todas as configurações de conexão com o Database (host, porta, usuário, senha, nome do banco), sem valores hardcoded em nenhum arquivo rastreado pelo Git.
3. THE API SHALL carregar as variáveis de ambiente usando a dependência `dotenv` antes do primeiro acesso a qualquer variável de configuração do Database.
4. IF uma variável de ambiente obrigatória para a conexão com o Database (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`) estiver ausente na inicialização, THEN THE API SHALL registrar no log qual variável está ausente e encerrar o processo com código de saída diferente de zero.

---

### Requirement 9: Containerização da API com Docker

**User Story:** Como operador, quero que a API seja empacotada em uma imagem Docker funcional e segura, para que possa ser executada de forma consistente em qualquer ambiente.

#### Acceptance Criteria

1. THE API SHALL ter um `Dockerfile` funcional localizado em `app/Dockerfile` com ao menos dois estágios usando imagens base distintas para separar as etapas de instalação de dependências e execução da aplicação.
2. THE API SHALL ser executada dentro do Container com um usuário cujo UID seja diferente de 0 (não-root), verificável pelo comando `docker inspect` ou `id` dentro do container.
3. THE API SHALL ter um arquivo `app/.dockerignore` que exclua ao menos `node_modules/`, `.env` e arquivos `*.log` do contexto de build.
4. WHEN a imagem Docker é construída com `docker build` e o container é iniciado com as variáveis de ambiente necessárias, THE Container SHALL responder ao endpoint `/health` com status HTTP 200 em no máximo 10 segundos após a inicialização.

---

### Requirement 10: Orquestração com Docker Compose

**User Story:** Como desenvolvedor, quero executar toda a stack (API + PostgreSQL) com um único comando, para que o ambiente local de desenvolvimento e teste seja reproduzível.

#### Acceptance Criteria

1. THE Compose_Stack SHALL ter um arquivo `docker-compose.yml` na raiz do projeto com exatamente dois serviços nomeados `api` e `db`, declarados nas seções `services`, `networks` e `volumes`.
2. THE Compose_Stack SHALL configurar uma rede bridge customizada com nome explícito para isolar a comunicação entre `api` e `db`.
3. THE Compose_Stack SHALL configurar um volume nomeado explícito para o serviço `db`, garantindo persistência dos dados do PostgreSQL entre reinicializações.
4. THE Compose_Stack SHALL configurar um healthcheck no serviço `db` usando `pg_isready` com `interval` ≤ 10s, `timeout` ≤ 5s e `retries` ≤ 5.
5. WHEN o serviço `db` não estiver no estado `healthy`, THE Compose_Stack SHALL manter o serviço `api` aguardando, configurado via `depends_on` com `condition: service_healthy`.
6. THE Compose_Stack SHALL ter um arquivo `.env.example` na raiz do projeto com os nomes de todas as variáveis de ambiente necessárias e valores de exemplo não-sensíveis (ex: `DB_PASSWORD=example_password`).
7. THE Compose_Stack SHALL garantir que o arquivo `.env` esteja listado no `.gitignore` e não seja rastreado pelo repositório Git.

---

### Requirement 11: Módulo VPC (Terraform)

**User Story:** Como engenheiro de infraestrutura, quero um módulo Terraform para a VPC, para que a rede AWS seja provisionada de forma isolada, reutilizável e com separação de responsabilidades.

#### Acceptance Criteria

1. THE VPC_Module SHALL aceitar uma variável de entrada `vpc_cidr` do tipo string sem valor padrão hardcoded e criar uma VPC na região `us-east-1` com esse CIDR.
2. THE VPC_Module SHALL criar ao menos duas subnets públicas e duas subnets privadas, cada par distribuído em duas Availability Zones distintas (`us-east-1a` e `us-east-1b`).
3. THE VPC_Module SHALL criar um Internet Gateway associado à VPC e uma route table para as subnets públicas com rota `0.0.0.0/0` apontando para o Internet Gateway, com associação explícita por subnet pública.
4. THE VPC_Module SHALL expor como outputs: `vpc_id`, lista `public_subnet_ids` e lista `private_subnet_ids`.
5. THE VPC_Module SHALL aplicar em todos os recursos tags `Name` e `Project` cujos valores sejam configuráveis via variáveis de entrada do módulo.

---

### Requirement 12: Módulo Security Group (Terraform)

**User Story:** Como engenheiro de infraestrutura, quero um módulo Terraform para os Security Groups, para que as regras de acesso à rede sejam definidas com menor privilégio e auditáveis.

#### Acceptance Criteria

1. THE SG_Module SHALL criar um Security Group para a EC2 com exatamente duas regras de ingress: porta 3000 (TCP) de `0.0.0.0/0` e porta 22 (TCP) de `0.0.0.0/0`.
2. THE SG_Module SHALL criar um Security Group para o RDS com exatamente uma regra de ingress: porta 5432 (TCP) somente a partir do Security Group da EC2 (sem CIDR adicional).
3. THE SG_Module SHALL declarar explicitamente uma regra de egress permitindo todo o tráfego (`0.0.0.0/0`) em ambos os Security Groups.
4. THE SG_Module SHALL aceitar `vpc_id` e `sg_ec2_id` como variáveis de entrada obrigatórias sem valor padrão.
5. THE SG_Module SHALL expor como outputs `sg_ec2_id` e `sg_rds_id`.

---

### Requirement 13: Módulo EC2 (Terraform)

**User Story:** Como engenheiro de infraestrutura, quero um módulo Terraform para a instância EC2, para que o servidor da API seja provisionado em subnet pública com as configurações corretas.

#### Acceptance Criteria

1. THE EC2_Module SHALL aceitar como variáveis de entrada obrigatórias: `vpc_id`, `subnet_id`, `security_group_id`, `ami_id` e `instance_type`, sem valores padrão hardcoded para os dois primeiros.
2. THE EC2_Module SHALL criar uma instância do tipo `t2.micro` (ou o valor de `instance_type`) na subnet pública especificada por `subnet_id`.
3. THE EC2_Module SHALL associar o Security Group da EC2 passado via `security_group_id` à instância.
4. THE EC2_Module SHALL configurar `iam_instance_profile = "LabInstanceProfile"` sem criar nenhum recurso IAM (user, group, role ou policy).
5. THE EC2_Module SHALL habilitar `associate_public_ip_address = true` na instância.
6. THE EC2_Module SHALL expor o IP público da instância como output nomeado `ec2_public_ip`.
7. THE EC2_Module SHALL aplicar em todos os recursos tags `Name` e `Project` configuráveis via variáveis de entrada.

---

### Requirement 14: Módulo RDS (Terraform)

**User Story:** Como engenheiro de infraestrutura, quero um módulo Terraform para o banco de dados RDS PostgreSQL, para que o banco de dados gerenciado seja provisionado em subnets privadas com segurança adequada.

#### Acceptance Criteria

1. THE RDS_Module SHALL criar uma instância RDS PostgreSQL engine versão `16` (ou compatível com `db.t3.micro`) do tipo `db.t3.micro` em subnets privadas, usando um DB Subnet Group criado pelo próprio módulo.
2. THE RDS_Module SHALL configurar `publicly_accessible = false` na instância RDS.
3. THE RDS_Module SHALL configurar `storage_encrypted = true` na instância RDS.
4. THE RDS_Module SHALL configurar `skip_final_snapshot = true` na instância RDS para permitir `terraform destroy` sem erro de snapshot obrigatório.
5. THE RDS_Module SHALL associar o Security Group do RDS passado via variável de entrada à instância.
6. THE RDS_Module SHALL expor o endpoint de conexão do RDS como output nomeado `rds_endpoint`.
7. THE RDS_Module SHALL aplicar em todos os recursos tags `Name` e `Project` configuráveis via variáveis de entrada.

---

### Requirement 15: Composição dos Módulos Terraform (infra raiz)

**User Story:** Como engenheiro de infraestrutura, quero um arquivo `infra/main.tf` que componha todos os módulos, para que a infraestrutura completa seja provisionada com um único comando `terraform apply`.

#### Acceptance Criteria

1. THE Terraform SHALL ter um arquivo `infra/main.tf` que invoque VPC_Module, SG_Module, EC2_Module e RDS_Module, passando outputs de módulos upstream como inputs para módulos downstream (ex: `vpc_id` do VPC_Module para o SG_Module).
2. THE Terraform SHALL ter um arquivo `infra/variables.tf` declarando ao menos as variáveis: `aws_region`, `vpc_cidr`, `project_name`, `db_username`, `db_password` (sensitive) e `key_name`.
3. THE Terraform SHALL ter um arquivo `infra/outputs.tf` expondo ao menos: `ec2_public_ip` (IP público da EC2), `rds_endpoint` (endpoint do RDS) e `api_url` (string composta `http://<ec2_public_ip>:3000`).
4. THE Terraform SHALL ter um arquivo `infra/providers.tf` configurando o provider AWS com `region = "us-east-1"`.
5. WHEN executado `terraform fmt -check` no diretório `infra/`, THE Terraform SHALL retornar exit code 0 em todos os arquivos `.tf`.
6. WHEN executado `terraform validate` após `terraform init` no diretório `infra/`, THE Terraform SHALL retornar exit code 0 sem erros de validação.

---

### Requirement 16: Remote State Backend (Terraform)

**User Story:** Como engenheiro de infraestrutura, quero que o state do Terraform seja armazenado remotamente no S3 com locking via DynamoDB, para que o estado seja compartilhável, versionado e protegido contra corrupção por execuções simultâneas.

#### Acceptance Criteria

1. THE Remote_Backend SHALL ser provisionado por uma configuração Terraform separada em `infra/backend/` que crie um bucket S3 com versionamento habilitado (`versioning { enabled = true }`) e criptografia server-side (`server_side_encryption_configuration`).
2. THE Remote_Backend SHALL criar uma tabela DynamoDB com `hash_key = "LockID"` e `billing_mode = "PAY_PER_REQUEST"` para locking de estado.
3. WHEN o Remote_Backend estiver provisionado, THE Terraform SHALL configurar o bloco `backend "s3"` em `infra/providers.tf` (ou `infra/backend.tf`) referenciando o nome do bucket e a tabela DynamoDB criados na etapa anterior.
4. IF a configuração do backend S3 for adicionada ao projeto principal antes de o bucket e a tabela DynamoDB existirem, THEN o `terraform init` SHALL falhar com erro de dependência circular; portanto o Remote_Backend DEVE ser aplicado antes de configurar o backend do projeto principal.

---

### Requirement 17: Segurança e Boas Práticas

**User Story:** Como avaliador, quero que o projeto nunca exponha credenciais reais, para que o repositório seja seguro e auditável.

#### Acceptance Criteria

1. THE API SHALL não conter senhas, tokens AWS ou chaves de acesso hardcoded em nenhum arquivo rastreado pelo Git (verificável por inspeção de todos os arquivos versionados).
2. THE Compose_Stack SHALL ter no `.gitignore` ao menos os padrões: `.env`, `*.tfstate`, `*.tfstate.backup`, `.terraform/` e `*.pem`.
3. IF um arquivo `.env` for necessário localmente, THEN THE Compose_Stack SHALL fornecer um arquivo `.env.example` na raiz do projeto com todos os nomes das variáveis e valores de placeholder não-sensíveis (ex: `DB_PASSWORD=example_password`), sem nenhuma senha real.
4. THE Terraform SHALL não conter nenhum recurso dos tipos `aws_iam_user`, `aws_iam_group` ou `aws_iam_role` em nenhum arquivo `.tf`, usando somente `LabInstanceProfile` como referência pré-existente.

---

### Requirement 18: Histórico Git com Conventional Commits

**User Story:** Como avaliador, quero que o projeto mantenha um histórico de commits semântico e rastreável, para que a evolução do projeto seja auditável.

#### Acceptance Criteria

1. THE Repository SHALL ter no mínimo 6 commits no histórico do branch `feature/prova-primeiro-bimestre` seguindo o padrão Conventional Commits com um dos prefixos: `feat`, `fix`, `docs`, `chore`, `infra`, `test`, `refactor`, `style`, `ci` ou `perf`.
2. WHEN um commit estiver prestes a ser realizado, THE Repository SHALL exibir os arquivos a serem commitados e a mensagem proposta ao usuário e aguardar uma resposta afirmativa explícita antes de executar `git commit`.
3. THE Repository SHALL nunca executar `git merge` automático entre branches sem confirmação explícita do usuário.

---

### Requirement 19: Coleta de Evidências

**User Story:** Como avaliadora, quero evidências documentadas de cada etapa do projeto, para que a execução correta de cada componente possa ser verificada.

#### Acceptance Criteria

1. THE Compose_Stack SHALL produzir evidência do build da imagem Docker como arquivo de texto com a saída completa do comando `docker build` armazenado em `evidencias/`.
2. THE Compose_Stack SHALL produzir evidência da execução dos containers como arquivo de texto com a saída completa de `docker compose up` e `docker compose ps` armazenado em `evidencias/`.
3. THE API SHALL produzir evidências dos testes de cada rota CRUD — POST `/reservas`, GET `/reservas`, GET `/reservas/:id`, PUT `/reservas/:id`, DELETE `/reservas/:id` e GET `/health` — como arquivos de texto com requisição e resposta completas armazenados em `evidencias/`.
4. THE Terraform SHALL produzir evidência da execução de `terraform validate` e `terraform plan` como arquivos de texto com saída completa armazenados em `evidencias/`, ambos retornando exit code 0.
5. THE Terraform SHALL produzir evidência de EC2 acessível como arquivo de texto com a resposta HTTP 200 no endpoint `http://<ec2_public_ip>:3000/health`, armazenado em `evidencias/`.
6. THE Terraform SHALL produzir evidência do RDS provisionado como arquivo de texto contendo a saída de `terraform show` ou captura de console mostrando o estado `available` do RDS, armazenado em `evidencias/`.
7. THE Terraform SHALL produzir evidência da execução bem-sucedida de `terraform destroy` como arquivo de texto com a saída completa do comando, armazenado em `evidencias/`.

---

### Requirement 20: Relatório do Projeto

**User Story:** Como aluna, quero documentar a experiência real de desenvolvimento do projeto, para que o processo de aprendizado e uso das ferramentas (incluindo esta Spec) seja registrado.

#### Acceptance Criteria

1. THE Repository SHALL ter um arquivo `relatorio.md` na raiz do projeto com ao menos quatro seções: (1) Visão Geral do Projeto, (2) Processo de Desenvolvimento (com uso da Spec), (3) Desafios e Soluções, (4) Conclusão.
2. THE Repository SHALL incluir no `relatorio.md` uma seção descrevendo o uso da Spec (Requirements, Design e Tasks) no desenvolvimento, mencionando como cada documento guiou as decisões de implementação.
3. THE Repository SHALL manter Requirements, Design e Tasks mutuamente rastreáveis: cada Task SHALL referenciar ao menos um Requirement, e cada Requirement SHALL ter ao menos uma Task correspondente.
