import { api, enviarJson } from "./api.js";
import { botao, mensagem, notificarAlteracao, notificarSelecao } from "./ui.js";

const API = "/jogadores";

function celulaTexto(valor) {
    const celula = document.createElement("td");
    celula.textContent = valor;
    return celula;
}

// Caixa usada pelo sorteio: os dados ficam em data-* e são lidos em times.js
function celulaSelecao(jogador) {
    const celula = document.createElement("td");
    const caixa = document.createElement("input");
    caixa.type = "checkbox";
    caixa.className = "disponivel form-check-input";
    Object.assign(caixa.dataset, {
        id: jogador.id, nome: jogador.nome, nota: jogador.nota, posicao: jogador.posicao,
    });
    caixa.addEventListener("change", notificarSelecao);
    celula.append(caixa);
    return celula;
}

function celulaEstatistica(jogador, campo) {
    const celula = document.createElement("td");
    celula.append(document.createTextNode(`${jogador[campo]} `));
    celula.append(botao("+", "btn-success", () => alterar(jogador.id, campo, "somar"), `Somar ${campo}`));
    celula.append(document.createTextNode(" "));
    celula.append(botao("−", "btn-outline-danger", () => alterar(jogador.id, campo, "subtrair"), `Subtrair ${campo}`));
    return celula;
}

function celulaAcoes(jogador) {
    const acoes = document.createElement("td");
    acoes.append(botao("Editar", "btn-primary", () => editarJogador(jogador)));
    acoes.append(document.createTextNode(" "));
    acoes.append(botao("Excluir", "btn-danger", () => excluirJogador(jogador.id)));
    return acoes;
}

function linhaJogador(jogador) {
    const linha = document.createElement("tr");
    linha.append(celulaSelecao(jogador), celulaTexto(jogador.nome), celulaTexto(jogador.posicao));
    linha.append(celulaEstatistica(jogador, "gols"));
    linha.append(celulaEstatistica(jogador, "jogos"));
    linha.append(celulaEstatistica(jogador, "vitorias"));
    linha.append(celulaTexto(jogador.nota), celulaAcoes(jogador));
    return linha;
}

// Goleiros: "gols" guarda os gols sofridos (GS)
function linhaGoleiro(jogador) {
    const linha = document.createElement("tr");
    linha.append(celulaSelecao(jogador), celulaTexto(jogador.nome));
    linha.append(celulaEstatistica(jogador, "gols"));
    linha.append(celulaEstatistica(jogador, "jogos"));
    linha.append(celulaTexto(jogador.nota), celulaAcoes(jogador));
    return linha;
}

function preencher(idTabela, jogadores, criarLinha) {
    const fragmento = document.createDocumentFragment();
    jogadores.forEach((jogador) => fragmento.append(criarLinha(jogador)));
    document.getElementById(idTabela).replaceChildren(fragmento);
}

export async function carregarJogadores() {
    const jogadores = await api(API);
    // guarda quem estava marcado para o sorteio, já que a tabela é redesenhada
    const marcados = new Set(Array.from(document.querySelectorAll(".disponivel:checked"), (c) => c.dataset.id));

    preencher("listaJogadores", jogadores.filter((j) => j.posicao !== "G").sort((a, b) => b.gols - a.gols), linhaJogador);
    preencher("listaGoleiros", jogadores.filter((j) => j.posicao === "G").sort((a, b) => a.gols - b.gols), linhaGoleiro);

    document.querySelectorAll(".disponivel").forEach((c) => (c.checked = marcados.has(c.dataset.id)));
    notificarSelecao();
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
