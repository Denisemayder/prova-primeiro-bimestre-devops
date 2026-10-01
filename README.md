# Prova Primeiro Bimestre - DevOps 2026.2

**Aluna:** Denise Maider Batista de Macedo  
**RA:** 6325028

## Descrição

Projeto desenvolvido para a prova do primeiro bimestre da disciplina de DevOps.

O projeto consiste em uma API REST de Reservas desenvolvida com Node.js, Express e PostgreSQL, conteinerizada com Docker e Docker Compose e implantada em infraestrutura AWS provisionada com Terraform.

O desenvolvimento também utilizou o Kiro com abordagem Spec-Driven Development, organizando Requirements, Design e Tasks.

## Tecnologias

- Node.js
- Express
- PostgreSQL
- Docker
- Docker Compose
- Terraform
- AWS
- Kiro

## API de Reservas

A API disponibiliza os seguintes endpoints:

- `GET /health` - verifica a disponibilidade da API
- `POST /reservas` - cria uma reserva
- `GET /reservas` - lista as reservas
- `GET /reservas/:id` - consulta uma reserva
- `PUT /reservas/:id` - atualiza uma reserva
- `DELETE /reservas/:id` - exclui uma reserva

## Docker

O ambiente local utiliza Docker Compose com dois serviços:

- API Node.js
- PostgreSQL

Para iniciar o ambiente:

```bash
docker compose up -d
```

Para verificar os containers:

```bash
docker compose ps
```

## Infraestrutura AWS

A infraestrutura foi provisionada com Terraform na região `us-east-1` e inclui:

- VPC
- Sub-redes públicas e privadas
- Security Groups
- EC2
- RDS PostgreSQL
- Backend remoto com S3 e DynamoDB

O bucket S3 utilizou versionamento e criptografia, enquanto o DynamoDB foi utilizado para locking do state do Terraform.

Ao final dos testes, os recursos provisionados na AWS foram destruídos.

## Terraform

Os arquivos de infraestrutura estão no diretório `infra/`.

A infraestrutura foi organizada em módulos para VPC, Security Groups, EC2 e RDS.

Foram executados e documentados comandos como:

```bash
terraform init
terraform validate
terraform plan
terraform apply
terraform destroy
```

## Evidências

As evidências de execução estão organizadas no diretório `evidencias/`, dividido em:

- `aws/`
- `docker/`
- `kiro/`
- `terraform/`

Elas incluem validações do Docker, API, CRUD, recursos AWS, Terraform, backend remoto e destruição da infraestrutura.

## Relatório

A experiência de desenvolvimento, os desafios encontrados, as soluções adotadas e a utilização do Kiro estão documentados no arquivo `relatorio.md`.

## Segurança

Arquivos contendo credenciais ou informações sensíveis não são versionados, incluindo:

- `.env`
- `terraform.tfvars`
- `*.tfstate`
- `*.pem`

O arquivo `.env.example` contém apenas valores de exemplo.
