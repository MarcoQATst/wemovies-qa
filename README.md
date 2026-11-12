# WeMovies | Testes E2E

Projeto do desafio de QA do WeMovies, com três fluxos automatizados em TypeScript
e Playwright. A suíte **WeMovies - Fluxo de compra** cobre a montagem do carrinho,
a alteração de quantidade e a finalização da compra.

Os dez cenários manuais estão no relatório Word entregue separadamente. Três
deles foram escolhidos para automação, com numeração própria no projeto:

| Teste automatizado | Cenário manual | Fluxo |
| --- | --- | --- |
| CT1 | CT03 | Adicionar filmes diferentes e conferir o total |
| CT2 | CT04 | Aumentar a quantidade e recalcular a compra |
| CT3 | CT10 | Finalizar e manter o carrinho vazio ao voltar |

CT1, CT2 e CT3 aparecem nessa ordem no arquivo de testes. Cada teste começa em um
contexto novo, prepara seus próprios dados pela interface e pode ser executado
sozinho ou em paralelo. A numeração não estabelece dependência entre eles.

Referências: [WeMovies](http://wemovies-qa.s3-website.us-east-2.amazonaws.com/)
e [Figma do desafio](https://www.figma.com/file/0ZyTELvPCSCnib16XG49YP/Teste-Front-React-WeFit---2022?node-id=0%3A1).

## Instalação e execução

Pré-requisitos: Node.js 22, npm e acesso à aplicação. Na pasta do projeto:

```bash
npm ci
npx playwright install chromium
npm run typecheck
npm run test:e2e
```

Em Linux, a instalação das bibliotecas do navegador pode ser feita com
`npx playwright install --with-deps chromium`.

| Comando | Uso |
| --- | --- |
| `npm run test:e2e` | Executar os três testes nos dois formatos |
| `npm run test:e2e -- --project=chromium` | Executar somente desktop |
| `npm run test:e2e -- --project=chromium-mobile` | Executar somente celular emulado |
| `npm run test:e2e -- --grep "CT2 -"` | Executar somente CT2 nos dois formatos |
| `npm run test:e2e:headed` | Executar com navegador visível |
| `npm run test:e2e:ui` | Abrir o modo interativo |
| `npm run typecheck` | Validar os tipos do TypeScript |
| `npm run report` | Abrir o relatório da última execução |

## Fluxos automatizados

### CT1 — Adicionar filmes diferentes

Confere os produtos escolhidos, os preços, as quantidades, os subtotais e a soma da compra.

```gherkin
Cenário: Comprar dois filmes diferentes
  Dado que estou na Home com o carrinho vazio
  Quando adiciono uma unidade de Morbius por R$ 1,50
  E uma unidade de Batman por R$ 21,90
  E acesso o carrinho
  Então devo encontrar os dois filmes com quantidade 1 e seus respectivos preços
  E os subtotais devem ser R$ 1,50 e R$ 21,90
  E o contador deve mostrar 2 itens
  E o total deve ser R$ 23,40
```

### CT2 — Alterar a quantidade

Confere o recálculo ao aumentar um filme e a preservação do outro item.

```gherkin
Cenário: Aumentar a quantidade de um filme
  Dado que tenho 2 unidades de Viúva Negra a R$ 9,99 cada
  E uma unidade de Morbius a R$ 1,50 no carrinho
  Quando aumento uma unidade de Viúva Negra
  Então sua quantidade deve ser 3 e seu subtotal R$ 29,97
  E Morbius deve manter quantidade 1 e subtotal de R$ 1,50
  E o contador deve mostrar 4 itens
  E o total deve ser R$ 31,47
```

### CT3 — Finalizar a compra

Confere a confirmação e garante que os itens não voltem ao retornar pelo navegador.

```gherkin
Cenário: Finalizar a compra e voltar ao carrinho
  Dado que estou no carrinho com uma unidade de Homem Aranha por R$ 29,90
  Quando finalizo o pedido
  Então devo acessar a confirmação de compra realizada com sucesso
  E o contador deve mostrar 0 itens
  Quando volto pelo navegador
  Então o carrinho deve estar vazio
  E não deve exibir produtos, total ou botão de finalizar
```

## Desktop e celular

| Projeto | Configuração |
| --- | --- |
| `chromium` | Chromium desktop, 1280 × 720 |
| `chromium-mobile` | Chromium com perfil Pixel 7, 412 × 839 e toque habilitado |

São três cenários em dois projetos: seis execuções por rodada. A suíte também
confere os dois primeiros cards empilhados na Home mobile, o subtotal visível
em cada layout e a ausência de rolagem horizontal nas telas percorridas.

A emulação não substitui a execução em aparelho físico. Safari, Firefox e
comparação automática de pixels com o Figma não fazem parte desta suíte.

## Relatório e evidências

O HTML é gerado em `playwright-report/`. Abra com `npm run report` e selecione um
teste para consultar as etapas em português e o cenário manual correspondente.

- Nos testes aprovados, são anexadas screenshots após as validações principais.
- Nas falhas, são mantidos screenshot, vídeo e trace, quando a execução permite a captura.
- O trace permite investigar ações, snapshots do DOM e requisições de rede.

Os resultados brutos ficam em `test-results/`. Cada rodada substitui o relatório
anterior; para compartilhar uma execução, preserve toda a pasta `playwright-report/`.
Essas pastas, as dependências e documentos Word não são versionados.

## CI no GitHub Actions

O workflow `.github/workflows/e2e.yml` está preparado para pushes e pull requests
para `main`, além de execução manual pela aba **Actions**. A sequência é:

1. Obter o código e preparar o Node.js 22 com cache do npm.
2. Instalar as dependências com `npm ci`.
3. Instalar o Chromium e suas bibliotecas do sistema.
4. Validar o TypeScript e executar os testes em desktop e mobile.
5. Disponibilizar o artefato **relatorio-playwright** com relatório e evidências,
   inclusive quando houver falhas, por 14 dias.

Execuções antigas da mesma branch são canceladas quando chega uma nova alteração.
No CI são usados dois workers. Os testes não possuem retries, pausas fixas ou
dependência de estado de outra execução. O workflow verifica qualidade; não há
etapa de deploy, pois este projeto contém apenas os testes.

Após baixar e extrair o artefato, o relatório pode ser aberto na pasta do projeto:

```bash
npx playwright show-report "caminho-extraido/playwright-report"
```

A validação do workflow no GitHub depende da publicação do repositório.

## Organização

```text
.github/workflows/e2e.yml   Pipeline de testes e artefatos
tests/
  compra.spec.ts           Suíte com CT1, CT2 e CT3
  helpers/wemovies.ts       Seletores, conferências e anexos
playwright.config.ts       Projetos, ambiente, timeouts e evidências
tsconfig.json              Configuração do TypeScript
```

As esperas usam estados da interface e asserções do Playwright. Os timeouts da
configuração são limites de falha, não pausas na execução. Os preços esperados
são explícitos e devem ser revisados se houver uma alteração real no catálogo.

O botão de incremento não tem nome acessível na aplicação. Ele é localizado no
contador do filme escolhido, onde os botões seguem a ordem diminuir e aumentar.

## Outro ambiente

O endereço padrão é o WeMovies fornecido no desafio. Para substituí-lo no PowerShell:

```powershell
$env:BASE_URL = 'http://endereco-do-ambiente'
npm run test:e2e
Remove-Item Env:BASE_URL
```

O projeto lê variáveis do ambiente e não carrega `.env` automaticamente.
