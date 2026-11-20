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
  auth.py                   login de admin (sessão assinada, limite de tentativas)
  routes/                   paginas, auth, jogadores, rankings, imagens, times (blueprints)
  repositories/partidas.py  vitórias de time (tabela `partidas`)
  repositories/dia.py       fechamento do dia (+1 vitória ao time campeão)
  services/imagem.py        geração do PNG com Pillow (sem Flask/banco)
  templates/index.html
  static/css, static/img, static/fonts
  static/js/sorteio.js      algoritmo do sorteio (puro, sem DOM)
  static/js/times.js        campos, arrastar, registrar jogos, vitória, imagens dos times
  static/js/auth.js         login/logout e modo admin na tela
  static/js/dia.js          janela "Fechar o dia"
sql/                        scripts SQL de referência
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
- Veja direto no navegador: `/top10-imagem` (ou `/top10-imagem?download=1` para baixar). A imagem sai com
  a data de geração ("Atualizado em DD/MM/AAAA", no fuso `FUSO_HORARIO`) e o arquivo baixa como `top10-AAAA-MM-DD.png`.
- Se trocar a arte por outra com posições diferentes, ajuste o dicionário `LAYOUT` em
  `futebol/services/imagem.py` (medidas da arte de 1536x1024).

## Novo ranking
Adicione uma entrada em `futebol/rankings.py` (API e tela). Para entrar na imagem, a arte precisa de uma lista a mais e uma entrada em `LAYOUT`.

## Sorteio de times
1. Marque os jogadores presentes (checkbox nas tabelas Jogadores e Goleiros). Mínimo: 21.
2. **Sortear** divide em 3 times, com o mesmo número de jogadores e as posições distribuídas por igual.
   Com **Equilibrar notas** ligado, a soma das notas também fica parecida entre os times.
3. Arraste jogadores entre os campos para ajustar. **Registrar jogos** soma +1 jogo para todos;
   **Vitória** registra a vitória do time no ranking do dia; **Imagens dos times** baixa uma imagem por time (`time-1-AAAA-MM-DD.png`, ...).

Requer a tabela `partidas (nome_time, data_partida)` no banco. O "ranking do dia" usa o fuso
`America/Sao_Paulo` (mude com a variável `FUSO_HORARIO`).

## Senha de administrador
Visitantes **veem** tudo (tabelas, rankings, imagem do Top 10) e podem **sortear** e ajustar os times
na tela, mas só o admin pode cadastrar/editar/excluir jogadores, somar gols/jogos/vitórias,
registrar jogos e salvar vitórias. Os botões de edição só aparecem depois do login, e o servidor
recusa (401) qualquer escrita sem login, mesmo que alguém chame a API direto.

Configure no servidor (Render > Environment):
| Variável | Valor |
|---|---|
| `ADMIN_PASSWORD` | a senha do grupo (use uma longa) |
| `SECRET_KEY` | `python -c "import secrets; print(secrets.token_hex(32))"` (igual em todos os workers) |
| `COOKIE_SEGURO` | `1` em produção (https) / `0` local |
| `TRUST_PROXY` | `1` no Render/Railway/Heroku |

- Sem `ADMIN_PASSWORD` a proteção fica desligada e a tela mostra um aviso amarelo.
- Com `ADMIN_PASSWORD` e sem `SECRET_KEY`, o app se recusa a iniciar (para não ficar inseguro sem querer).
- 5 senhas erradas bloqueiam novas tentativas por 5 minutos. O login dura 30 dias no aparelho.
- Para trocar a senha, mude `ADMIN_PASSWORD`. Para deslogar todo mundo, mude `SECRET_KEY`.

## Uso no celular
- As tabelas viram cartões, e os botões têm tamanho de toque.
- Para trocar um jogador de time: toque nele no campo e escolha o time (arrastar também funciona no computador).
- Editar jogador e login abrem janelas próprias (nada de `prompt()` do navegador).

## Fechar o dia (vitórias em massa)
No fim da noite, o time com **mais vitórias no dia** (botão **Vitória** de cada time) ganha **+1 na coluna
`vitorias`** dos seus jogadores, alimentando o ranking "Mais vitórias".

1. Admin: clique em **🏁 Fechar o dia**.
2. A janela mostra o time líder e a lista de jogadores dele (vinda do sorteio). **Goleiros vêm desmarcados**
   (não entram no ranking de vitórias); marque/desmarque como quiser.
3. **Confirmar +1 vitória** soma 1 para cada marcado, tudo numa transação.

Regras de segurança:
- Só dá para fechar **uma vez por dia** (o banco barra o segundo clique). Errou? **↩️ Desfazer fechamento** remove o +1.
- O servidor confere que o time informado é mesmo o líder do dia. Em **empate**, a janela deixa escolher entre os empatados.
- Se o sorteio não estiver neste aparelho (ex.: outro celular), a janela lista todos os jogadores para você marcar quem jogou.
- O sorteio agora fica guardado no aparelho durante o dia, então recarregar a página não o perde.
- Cria sozinha a tabela `fechamentos_dia` (script de referência em `sql/001_fechamentos_dia.sql`).
