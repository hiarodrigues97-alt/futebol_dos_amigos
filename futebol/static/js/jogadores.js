import { api, enviarJson } from "./api.js";
import { botao, mensagem, notificarAlteracao } from "./ui.js";

const API = "/jogadores";

function celulaEstatistica(jogador, campo) {
    const celula = document.createElement("td");
    celula.append(document.createTextNode(`${jogador[campo]} `));
    celula.append(botao("+", "btn-success", () => alterar(jogador.id, campo, "somar"), `Somar ${campo}`));
    celula.append(document.createTextNode(" "));
    celula.append(botao("−", "btn-outline-danger", () => alterar(jogador.id, campo, "subtrair"), `Subtrair ${campo}`));
    return celula;
}

function celulaTexto(valor) {
    const celula = document.createElement("td");
    celula.textContent = valor;
    return celula;
}

function linhaJogador(jogador) {
    const linha = document.createElement("tr");
    linha.append(celulaTexto(jogador.nome), celulaTexto(jogador.posicao));
    linha.append(celulaEstatistica(jogador, "gols"));
    linha.append(celulaEstatistica(jogador, "jogos"));
    linha.append(celulaEstatistica(jogador, "vitorias"));
    linha.append(celulaTexto(jogador.nota));

    const acoes = document.createElement("td");
    acoes.append(botao("Editar", "btn-primary", () => editarJogador(jogador)));
    acoes.append(document.createTextNode(" "));
    acoes.append(botao("Excluir", "btn-danger", () => excluirJogador(jogador.id)));
    linha.append(acoes);
    return linha;
}

export async function carregarJogadores() {
    const jogadores = await api(API);
    const fragmento = document.createDocumentFragment();
    jogadores.forEach((jogador) => fragmento.append(linhaJogador(jogador)));
    document.getElementById("listaJogadores").replaceChildren(fragmento);
}

export async function adicionarJogador() {
    const campoNome = document.getElementById("nome");
    const campoNota = document.getElementById("nota");
    const nome = campoNome.value.trim();
    const posicao = document.getElementById("posicao").value;
    const nota = campoNota.value;
    if (!nome || nota === "") return mensagem("Informe nome e nota.", "warning");

    try {
        await enviarJson(API, "POST", { nome, posicao, nota });
        campoNome.value = "";
        campoNota.value = "";
        notificarAlteracao();
        mensagem("Jogador adicionado.");
    } catch (erro) { mensagem(erro.message, "danger"); }
}

async function alterar(id, campo, acao) {
    try {
        await enviarJson(`${API}/${id}/estatistica`, "POST", { campo, acao });
        notificarAlteracao();
    } catch (erro) { mensagem(erro.message, "danger"); }
}

async function editarJogador(jogador) {
    const nome = prompt("Nome:", jogador.nome);
    if (nome === null || !nome.trim()) return;
    const posicao = prompt("Posição (A, M, Z ou G):", jogador.posicao);
    if (posicao === null || !posicao.trim()) return;
    const nota = prompt("Nota:", jogador.nota);
    if (nota === null || nota === "" || Number.isNaN(Number(nota))) {
        return mensagem("Informe uma nota válida.", "warning");
    }
    try {
        await enviarJson(`${API}/${jogador.id}`, "PUT", { nome, posicao, nota });
        notificarAlteracao();
        mensagem("Jogador atualizado.");
    } catch (erro) { mensagem(erro.message, "danger"); }
}

async function excluirJogador(id) {
    if (!confirm("Deseja excluir este jogador?")) return;
    try {
        await api(`${API}/${id}`, { method: "DELETE" });
        notificarAlteracao();
        mensagem("Jogador excluído.");
    } catch (erro) { mensagem(erro.message, "danger"); }
}
