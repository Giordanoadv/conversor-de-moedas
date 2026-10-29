# Conversor de Moedas · Giordano Bruno

Conversor responsivo em HTML, CSS e JavaScript. Evolução do projeto original de Giordano Bruno Carvalho Alencar, com cotações consultadas na AwesomeAPI no lugar dos valores fixos.

**Site público:** https://giordanoadv.github.io/conversor-de-moedas/

## Recursos

- Conversão nos dois sentidos entre BRL, USD, EUR, GBP, CAD, AUD, JPY, CHF, ARS e BTC.
- Consulta automática a cada 60 segundos enquanto a aba estiver visível, atualização manual e inversão do par.
- Entradas no padrão brasileiro (`1.000,50`), validação de valores e 8 casas decimais para bitcoin.
- Fonte, horário de cada cotação e data da última consulta visíveis.
- Tratamento de indisponibilidade, limites HTTP, timeouts e dados inválidos; nunca usa taxas fictícias.
- Última resposta válida guardada no navegador por até 7 dias para consulta durante falhas, sempre com aviso e data original. Dados com mais de 15 minutos recebem aviso adicional na conversão.
- Interface para celular, navegação por teclado, preferências de moeda e cópia do resultado.

## Cotações e limites

Fonte: [AwesomeAPI](https://docs.awesomeapi.com.br/api-de-moedas), endpoint público `https://economia.awesomeapi.com.br/json/last/`.

As consultas ocorrem a cada **1 minuto**. O acesso sem chave está sujeito a cache: a documentação menciona 1 minuto, mas a resposta observada na validação trouxe `Cache-Control: max-age=300` (5 minutos), além de políticas de cache em caso de falha. Por isso, a interface não promete dados sem atraso. Atualização automática não significa transmissão de negócios a cada segundo. Mercado fechado, atraso ou indisponibilidade da fonte podem produzir cotações anteriores; o horário da cotação sempre acompanha o resultado. Não é necessário criar conta ou colocar uma chave no JavaScript.

Usamos a média `(bid + ask) / 2` para a cotação indicativa de cada moeda em BRL. A conversão segue:

```text
valor convertido = valor × cotação da origem em BRL ÷ cotação do destino em BRL
```

Taxas cruzadas passam pelo real. A variação exibida é `pctChange` (variação de compra) fornecida pela API. São valores de referência, sem IOF, spread de instituições ou tarifas. Bitcoin é um criptoativo. A disponibilidade do serviço público depende da fonte e de seus limites.

## Executar e testar

Não há dependências de instalação. Para os testes e preparação dos arquivos, use Node.js 20 ou posterior:

```sh
npm test
npm run build
```

O build copia apenas os arquivos públicos para `dist/`. Para executar localmente, sirva a raiz com um servidor HTTP (por exemplo, Live Server do editor ou `python3 -m http.server 8000`) e abra `http://localhost:8000`. Módulos JavaScript precisam de HTTP; não abra o HTML via `file://`.

## Publicação no GitHub Pages

O repositório já usa o GitHub Pages com a branch `main` e a pasta raiz. `index.html`, `indexmoedas.css`, `indexmoedas.js`, `rates.mjs` e `favicon.svg` ficam na raiz, e os caminhos relativos funcionam no subdiretório `/conversor-de-moedas/`. A pasta `assests2` do projeto original é preservada no repositório.

Para republicar, envie as alterações para `main` e acompanhe a execução **pages build and deployment** na aba Actions. O site não precisa de backend nem de um processo Node em produção. Sites também pode servir o conteúdo idêntico de `dist/`.

## Estrutura

| Arquivo | Responsabilidade |
| --- | --- |
| `index.html` | Estrutura semântica da página |
| `indexmoedas.css` | Layout responsivo e estilos |
| `indexmoedas.js` | Interface, estado, atualização, cache e eventos |
| `rates.mjs` | API, validação de cotações, conversão e formatação |
| `tests/rates.test.mjs` | Casos de conversão, entradas, precisão, indisponibilidade e timeout |
| `build.mjs` | Copia os arquivos públicos para `dist/` |

O cache e as preferências ficam somente no navegador. O valor digitado não é enviado à API; a conversão é calculada localmente.
