-- Registro de "dia fechado": qual time foi campeão e quem recebeu +1 vitória.
-- O app cria esta tabela sozinho se ela não existir; o arquivo fica aqui só como documentação.
CREATE TABLE IF NOT EXISTS fechamentos_dia (
    data_dia  date PRIMARY KEY,          -- um fechamento por dia (impede somar duas vezes)
    nome_time text NOT NULL,             -- 'TIME 1', 'TIME 2' ou 'TIME 3'
    jogadores integer[] NOT NULL,        -- ids que receberam +1 (permite desfazer)
    criado_em timestamptz NOT NULL DEFAULT now()
);
