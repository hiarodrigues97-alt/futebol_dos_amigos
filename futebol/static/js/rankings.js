import { api, baixarArquivo } from "./api.js";
import { mensagem } from "./ui.js";

const RANKINGS = [
    { tipo: "artilheiros", destino: "rankingArtilheiros", campo: "gols" },
    { tipo: "vitoriosos", destino: "rankingVitoriosos", campo: "vitorias" },
];

async function carregarRanking({ tipo, destino, campo }) {
    const ranking = await api(`/ranking/${tipo}`);
    const fragmento = document.createDocumentFragment();
    ranking.forEach((jogador, indice) => {
        const item = document.createElement("div");
        item.className = "ranking-item";
        const nome = document.createElement("span");
        nome.textContent = `${indice + 1}º ${jogador.nome}`;
        const valor = document.createElement("strong");
        valor.textContent = `${jogador[campo]} ${campo}`;
        item.append(nome, valor);
        fragmento.append(item);
    });
    document.getElementById(destino).replaceChildren(fragmento);
}

export function carregarRankings() {
    return Promise.all(RANKINGS.map(carregarRanking));
}

export async function gerarImagem(botaoClicado) {
    if (botaoClicado) botaoClicado.disabled = true;
    try {
        await baixarArquivo("/top10-imagem?download=1", "top10-futebol-dos-amigos.png");
    } catch (erro) {
        mensagem(erro.message, "danger");
    } finally {
        if (botaoClicado) botaoClicado.disabled = false;
    }
}
