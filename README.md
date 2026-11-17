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
  services/imagem.py        geração do PNG com Pillow (sem Flask/banco)
  templates/index.html
  static/css, static/js (módulos ES), static/img, static/fonts
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
