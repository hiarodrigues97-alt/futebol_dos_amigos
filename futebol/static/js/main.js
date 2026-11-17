import { adicionarJogador, carregarJogadores } from "./jogadores.js";
import { carregarRankings, gerarImagem } from "./rankings.js";
import { EVENTO_ALTERACAO, mensagem } from "./ui.js";

async function atualizar() {
    try {
        await Promise.all([carregarJogadores(), carregarRankings()]);
    } catch (erro) { mensagem(erro.message, "danger"); }
}

document.addEventListener(EVENTO_ALTERACAO, atualizar);
document.getElementById("btnAdicionar").addEventListener("click", adicionarJogador);
const btnImagem = document.getElementById("btnImagem");
btnImagem.addEventListener("click", () => gerarImagem(btnImagem));

atualizar();
