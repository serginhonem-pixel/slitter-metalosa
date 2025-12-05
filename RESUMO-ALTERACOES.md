# Resumo das alterações recentes

Este arquivo descreve, em português, as principais mudanças realizadas no otimizador de corte.

## Correções de cálculo e dados
- Ajuste no cálculo de peso por tira para respeitar efetivamente a largura disponível da bobina, inclusive ao gerar sugestões e estimativas de eficiência.
- Correção na leitura de arquivos CSV legados para capturar corretamente largura, espessura e tipo de material (BQ/BZ/BF) a partir das colunas finais, evitando que a espessura apareça no seletor de material.
- Normalização das opções de tipo de material para sempre exibir códigos em maiúsculas e sem valores numéricos.

## Melhoria de busca de combinações
- Expansão da busca de combinações para considerar até quatro larguras de produto e um conjunto maior de candidatos, melhorando a ocupação da largura e redução de sucata.
- Alinhamento do otimizador legado com as mesmas regras de busca e uso de largura útil para estimar peso e eficiência.

## Experiência na interface
- Inclusão de uma seção "Melhorias futuras" dentro da interface com ideias priorizadas (presets de setup, KPIs, alertas e integração) para orientar evoluções do produto.

> Observação: em alguns ambientes de execução não há Node.js disponível, portanto o comando `npm run build` pode falhar fora de uma máquina de desenvolvimento preparada.
