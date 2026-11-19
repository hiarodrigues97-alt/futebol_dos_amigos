import { iniciarAuth } from "./auth.js";
import { carregarDia, iniciarDia } from "./dia.js";
import { adicionarJogador, carregarJogadores, iniciarEdicao } from "./jogadores.js";
import { carregarRankings, gerarImagem } from "./rankings.js";
import { carregarRankingTimes, iniciarTimes } from "./times.js";
import { EVENTO_ALTERACAO, mensagem } from "./ui.js";

async function atualizar() {
    try {
        await Promise.all([carregarJogadores(), carregarRankings(), carregarRankingTimes(), carregarDia()]);
    } catch (erro) { mensagem(erro.message, "danger"); }
}

document.addEventListener(EVENTO_ALTERACAO, atualizar);
document.getElementById("btnAdicionar").addEventListener("click", adicionarJogador);

const btnImagem = document.getElementById("btnImagem");
btnImagem.addEventListener("click", () => gerarImagem(btnImagem));

iniciarAuth();
iniciarEdicao();
iniciarTimes();
iniciarDia();
atualizar();
