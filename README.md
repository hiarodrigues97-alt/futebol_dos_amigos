# Futebol dos Amigos

## Estrutura
```
app.py                      ponto de entrada
futebol/
  __init__.py               create_app() + tratamento de erros
  config.py                 variáveis de ambiente (DATABASE_URL, IMAGEM_FUNDO)
  db.py                     conexão/cursor do PostgreSQL
  rankings.py               definição dos rankings (título, coluna, rótulo)
  validators.py             validação dos dados recebidos
  errors.py                 exceções do projeto
  repositories/jogadores.py todo o SQL
  routes/                   paginas, jogadores, rankings, imagens (blueprints)
  repositories/partidas.py  vitórias de time (tabela `partidas`)
  services/imagem.py        geração do PNG com Pillow (sem Flask/banco)
  templates/index.html
  static/css, static/img, static/fonts
  static/js/sorteio.js      algoritmo do sorteio (puro, sem DOM)
  static/js/times.js        campos, arrastar, registrar jogos, vitória, copiar, imagem dos times
  static/js/*.js            demais módulos ES (api, ui, jogadores, rankings, main)
```

## Rodar
```
pip install -r requirements.txt
cp .env.example .env      # preencha DATABASE_URL
python app.py
```

## Imagem do Top 10
- A arte fica em `futebol/static/img/fundo-top10.png` (já incluída). A cada geração, o código
  apaga os nomes/números de exemplo da arte e escreve o ranking atual do banco.
- As fontes ficam em `futebol/static/fonts/` (DejaVu Sans Condensed, já incluídas).
- Veja direto no navegador: `/top10-imagem` (ou `/top10-imagem?download=1` para baixar).
- Se trocar a arte por outra com posições diferentes, ajuste o dicionário `LAYOUT` em
  `futebol/services/imagem.py` (medidas da arte de 1536x1024).

## Novo ranking
Adicione uma entrada em `futebol/rankings.py` (API e tela). Para entrar na imagem, a arte precisa de uma lista a mais e uma entrada em `LAYOUT`.

## Sorteio de times
1. Marque os jogadores presentes (checkbox nas tabelas Jogadores e Goleiros). Mínimo: 21.
2. **Sortear** divide em 3 times, com o mesmo número de jogadores e as posições distribuídas por igual.
   Com **Equilibrar notas** ligado, a soma das notas também fica parecida entre os times.
3. Arraste jogadores entre os campos para ajustar. **Registrar jogos** soma +1 jogo para todos;
   **Vitória** registra a vitória do time no ranking do dia; **Copiar** e **Imagem dos times** exportam.

Requer a tabela `partidas (nome_time, data_partida)` no banco. O "ranking do dia" usa o fuso
`America/Sao_Paulo` (mude com a variável `FUSO_HORARIO`).
