# Relatório de Desenvolvimento — API de Reservas TechNova

**Aluna:** Denise Maider Batista de Macedo  
**RA:** 6325028  
**Disciplina:** DevOps  
**Projeto:** API de Reservas TechNova  

## 1. Visão Geral

O projeto teve como objetivo desenvolver e disponibilizar uma API REST para gerenciamento de reservas da empresa fictícia TechNova. A aplicação foi desenvolvida utilizando Node.js e Express, com PostgreSQL como banco de dados.

A API possui operações de criação, consulta, atualização e exclusão de reservas, além de uma rota `/health` para verificar a disponibilidade da aplicação.

Também foi utilizado Docker para conteinerização da aplicação e Docker Compose para execução da API juntamente com um PostgreSQL em ambiente local.

Para a infraestrutura em nuvem foi utilizado Terraform, criando recursos na AWS como VPC, sub-redes públicas e privadas, Security Groups, EC2 e RDS PostgreSQL.

O estado do Terraform foi configurado de forma remota utilizando Amazon S3 e DynamoDB. A aplicação foi implantada em um container Docker dentro de uma instância EC2 e conectada ao PostgreSQL executado no Amazon RDS.

## 2. Processo de Desenvolvimento

O desenvolvimento foi realizado de forma incremental, separando aplicação, containers e infraestrutura.

Utilizei o Kiro com a abordagem Spec-Driven Development para auxiliar no planejamento do projeto. A especificação foi organizada em três documentos principais: `requirements.md`, `design.md` e `tasks.md`.

No `requirements.md` foram definidos os requisitos da API, Docker, infraestrutura AWS, segurança e evidências. No `design.md` foi detalhada a arquitetura da solução e a comunicação entre os componentes. No `tasks.md` os requisitos foram transformados em tarefas para orientar a implementação.

Depois da criação da Spec, a implementação foi realizada e versionada em uma branch específica chamada `feature/prova-primeiro-bimestre`, utilizando Conventional Commits.

Primeiro foi desenvolvida a API Node.js/Express com conexão ao PostgreSQL e as rotas de CRUD de reservas. Depois foram criados o Dockerfile e o Docker Compose. A aplicação também foi testada durante o desenvolvimento.

Na etapa seguinte, utilizei Terraform para criar a infraestrutura AWS de forma modular. Foram utilizados módulos separados para VPC, Security Groups, EC2 e RDS.

Também configurei um backend remoto para o Terraform utilizando um bucket S3 para armazenamento do state e uma tabela DynamoDB para o locking.

Após a criação da infraestrutura, acessei a EC2 por SSH, instalei Docker e Git, clonei o projeto e executei a API em um container Docker. A aplicação passou a se comunicar com o banco PostgreSQL privado no RDS.

Ao final do desenvolvimento, utilizei novamente o Kiro para realizar uma revisão da implementação comparando o projeto com Requirements, Design e Tasks.

## 3. Desafios e Soluções

Um dos desafios ocorreu durante a criação do backend remoto do Terraform no AWS Academy. Algumas operações relacionadas ao S3 sofreram restrições pelas políticas do ambiente Learner Lab. Foi necessário trabalhar dentro das permissões disponíveis e validar a configuração do bucket e do backend remoto.

Outro desafio aconteceu durante a conexão entre a API executada na EC2 e o PostgreSQL do RDS. Inicialmente a conexão foi recusada porque o RDS exigia uma conexão criptografada. Para resolver o problema, foi habilitado SSL na configuração do cliente PostgreSQL utilizado pela aplicação.

Durante a implantação também ocorreu uma falha de autenticação no banco de dados. A configuração utilizada pela aplicação na EC2 foi revisada e corrigida, permitindo que o container estabelecesse a conexão corretamente com o RDS.

A segurança da infraestrutura também exigiu atenção. O banco RDS foi configurado como não público e sua porta 5432 aceita conexões somente provenientes do Security Group da EC2. Já a EC2 possui acesso às portas necessárias para SSH e para disponibilização da API.

Outro cuidado importante foi não versionar informações sensíveis. Arquivos como `.env`, `terraform.tfvars`, arquivos de state do Terraform e chaves `.pem` foram incluídos no `.gitignore`.

Foram realizados testes reais na infraestrutura AWS. A rota `/health` respondeu corretamente e o CRUD completo foi validado com criação, consulta, atualização e exclusão de uma reserva armazenada no PostgreSQL RDS.

## 4. Uso de Inteligência Artificial e Kiro

A inteligência artificial foi utilizada como ferramenta de apoio durante o planejamento, desenvolvimento, diagnóstico de erros e documentação do projeto.

O Kiro foi utilizado principalmente através da metodologia Spec-Driven Development. A ferramenta auxiliou na criação dos Requirements, Design e Tasks, permitindo organizar os requisitos antes da implementação.

Durante o uso do Kiro também enfrentei uma situação importante: em determinado momento, a ferramenta tentou avançar além do que eu havia solicitado, propondo ou iniciando ações por conta própria em vez de apenas executar a etapa que eu havia pedido.

Como eu queria manter o controle sobre cada alteração realizada no projeto, passei a utilizar instruções mais específicas para o Kiro. Comecei a deixar explícito quando a ferramenta deveria somente analisar, revisar ou trabalhar com a especificação, sem modificar arquivos, executar ações adicionais, realizar commits ou tomar decisões por conta própria.

Essa experiência mostrou que uma ferramenta de inteligência artificial integrada ao ambiente de desenvolvimento precisa ser supervisionada. Mesmo quando a sugestão parece correta, é importante entender o que será realizado antes de permitir uma alteração no projeto.

Por esse motivo, durante o restante do desenvolvimento, procurei trabalhar de forma mais controlada. As sugestões das ferramentas de IA eram analisadas antes da execução, principalmente nas etapas relacionadas à AWS, Terraform e Git.

Um exemplo aconteceu na revisão final do projeto. O Kiro recebeu a instrução explícita de comparar a implementação com Requirements, Design e Tasks, mas sem modificar nenhum arquivo, sem fazer commit e sem executar `terraform destroy`.

A revisão final também mostrou a importância da verificação humana. O Kiro indicou que o backend S3 poderia não estar configurado no projeto principal. Após a análise, conferi manualmente o arquivo `infra/backend.tf` e confirmei que o bloco `backend "s3"` estava presente e configurado com o bucket S3 e a tabela DynamoDB.

Além disso, durante a execução do `terraform plan`, foi possível observar o Terraform adquirindo e liberando o state lock, confirmando o funcionamento da configuração utilizada.

Portanto, uma das principais experiências que tive utilizando IA neste projeto foi entender que a ferramenta ajuda bastante no desenvolvimento, mas suas respostas não devem ser consideradas automaticamente corretas. É necessário conferir arquivos, comandos e resultados antes de realizar alterações.

O Kiro foi utilizado novamente ao final para revisar toda a implementação existente em comparação com a Spec. A ferramenta analisou a API, Docker, Terraform, infraestrutura e evidências e apontou os itens que já estavam atendidos e os que ainda precisavam ser finalizados.

Dessa forma, a inteligência artificial foi utilizada como apoio ao processo de desenvolvimento, enquanto as decisões, verificações e execuções permaneceram sob minha responsabilidade.

## 5. Evidências e Validação

Durante o desenvolvimento foram coletadas evidências para demonstrar o funcionamento das principais partes do projeto.

O `terraform validate` confirmou que a configuração da infraestrutura era válida. Após a criação dos recursos, o `terraform state list` demonstrou que os recursos da VPC, sub-redes, Internet Gateway, Security Groups, EC2 e RDS estavam sendo gerenciados pelo Terraform.

Também foi executado um novo `terraform plan` depois da implantação. O resultado informou que não existiam alterações pendentes entre a configuração e a infraestrutura real.

A EC2 foi verificada através da AWS CLI e estava em estado `running`. O RDS PostgreSQL também foi verificado e estava em estado `available`, com armazenamento criptografado e sem acesso público.

Os Security Groups foram verificados para confirmar que a EC2 permitia o acesso necessário à aplicação e que o PostgreSQL RDS aceitava conexões na porta 5432 somente a partir do Security Group da EC2.

A API implantada na AWS também foi testada. A rota `/health` retornou status de funcionamento e foram executadas as operações de POST, GET, PUT e DELETE de uma reserva.

Também foi registrada a execução do container Docker `technova-api` dentro da EC2, expondo a porta 3000 utilizada pela aplicação.

As evidências foram organizadas dentro do diretório `evidencias/`, separadas por categorias como Terraform, AWS, Docker e Kiro.

## 6. Conclusão

O projeto permitiu aplicar de forma integrada conceitos de desenvolvimento de APIs, containers, infraestrutura como código, computação em nuvem e segurança.

A API de reservas foi desenvolvida com Node.js e Express, conteinerizada com Docker e implantada em uma instância EC2. O banco PostgreSQL foi disponibilizado através do Amazon RDS em uma infraestrutura que utiliza sub-redes privadas.

O Terraform permitiu criar a infraestrutura AWS de forma reproduzível e modular, enquanto o backend remoto utilizando S3 e DynamoDB permitiu trabalhar com o state remoto e mecanismo de locking.

As evidências coletadas demonstram a criação dos recursos AWS, a execução do container, a disponibilidade da API e o funcionamento das operações CRUD utilizando o banco de dados RDS.

O uso do Kiro através de Spec-Driven Development ajudou a organizar o projeto desde os requisitos até as tarefas. Ao mesmo tempo, a experiência também mostrou a importância de supervisionar ferramentas de inteligência artificial e verificar suas sugestões antes de permitir alterações no projeto.

Com este trabalho pude compreender melhor, na prática, como desenvolvimento, Docker, Terraform, AWS, Git e ferramentas de inteligência artificial podem fazer parte de um mesmo fluxo de DevOps.
