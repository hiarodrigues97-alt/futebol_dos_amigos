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
- Coloque seu fundo em `futebol/static/img/fundo-top10.png` (renomeie o arquivo "ChatGPT Image ...png").
  Sem ele, a imagem usa um fundo verde gerado.
- Coloque uma fonte `.ttf` em `futebol/static/fonts/` (ex.: DejaVuSans-Bold.ttf ou Roboto-Bold.ttf).
  Sem fontes no sistema, o Pillow usa a fonte padrão, que funciona mas é menos bonita.
- Teste direto no navegador: `/top10-imagem/artilheiros` e `/top10-imagem/vitoriosos`.

## Novo ranking
Adicione uma entrada em `futebol/rankings.py` (a rota e a imagem já passam a funcionar).
