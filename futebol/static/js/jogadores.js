import { api, enviarJson } from "./api.js";
import { botao, fecharAoClicarFora, mensagem, notificarAlteracao, notificarSelecao } from "./ui.js";

const API = "/jogadores";

// `rotulo` vira o título do campo no layout de cartões do celular (ver style.css)
function celulaTexto(valor, rotulo, campo) {
    const celula = document.createElement("td");
    celula.dataset.label = rotulo;
    celula.dataset.campo = campo;
    celula.textContent = valor;
    return celula;
}

// Caixa usada pelo sorteio: os dados ficam em data-* e são lidos em times.js
function celulaSelecao(jogador) {
    const celula = document.createElement("td");
    celula.dataset.label = "Jogar hoje";
    celula.dataset.campo = "sel";
    const caixa = document.createElement("input");
    caixa.type = "checkbox";
    caixa.className = "disponivel form-check-input";
    caixa.setAttribute("aria-label", `Selecionar ${jogador.nome}`);
    Object.assign(caixa.dataset, {
        id: jogador.id, nome: jogador.nome, nota: jogador.nota, posicao: jogador.posicao,
    });
    caixa.addEventListener("change", notificarSelecao);
    celula.append(caixa);
    return celula;
}

function celulaEstatistica(jogador, campo, rotulo) {
    const celula = document.createElement("td");
    celula.dataset.label = rotulo;
    celula.dataset.campo = campo;
    const grupo = document.createElement("span");
    grupo.className = "valor-estatistica";
    grupo.append(document.createTextNode(`${jogador[campo]} `));
    grupo.append(botao("+", "btn-success", () => alterar(jogador.id, campo, "somar"), `Somar ${rotulo}`, "somente-admin"));
    grupo.append(botao("−", "btn-outline-danger", () => alterar(jogador.id, campo, "subtrair"), `Subtrair ${rotulo}`, "somente-admin"));
    celula.append(grupo);
    return celula;
}

function celulaAcoes(jogador) {
    const acoes = document.createElement("td");
    acoes.className = "celula-acoes somente-admin";
    acoes.append(botao("Editar", "btn-primary", () => abrirEdicao(jogador)));
    acoes.append(botao("Excluir", "btn-danger", () => excluirJogador(jogador)));
    return acoes;
}

function linhaJogador(jogador) {
    const linha = document.createElement("tr");
    linha.append(celulaSelecao(jogador), celulaTexto(jogador.nome, "Nome", "nome"), celulaTexto(jogador.posicao, "Pos.", "pos"));
    linha.append(celulaEstatistica(jogador, "gols", "Gols"));
    linha.append(celulaEstatistica(jogador, "jogos", "Jogos"));
    linha.append(celulaEstatistica(jogador, "vitorias", "Vitórias"));
    linha.append(celulaTexto(jogador.nota, "Nota", "nota"), celulaAcoes(jogador));
    return linha;
}

// Goleiros: "gols" guarda os gols sofridos (GS)
function linhaGoleiro(jogador) {
    const linha = document.createElement("tr");
    linha.append(celulaSelecao(jogador), celulaTexto(jogador.nome, "Nome", "nome"));
    linha.append(celulaEstatistica(jogador, "gols", "Gols sofridos"));
    linha.append(celulaEstatistica(jogador, "jogos", "Jogos"));
    linha.append(celulaTexto(jogador.nota, "Nota", "nota"), celulaAcoes(jogador));
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

// ---------- EDITAR (modal no lugar do prompt(), que é ruim no celular) ----------
let jogadorEmEdicao = null;

function abrirEdicao(jogador) {
    jogadorEmEdicao = jogador;
    const form = document.getElementById("formEditar");
    form.elements.nome.value = jogador.nome;
    form.elements.posicao.value = jogador.posicao;
    form.elements.nota.value = jogador.nota ?? "";
    document.getElementById("erroEditar").textContent = "";
    document.getElementById("dlgEditar").showModal();
}

async function salvarEdicao(evento) {
    evento.preventDefault();
    const form = evento.target;
    const nome = form.elements.nome.value.trim();
    const posicao = form.elements.posicao.value;
    const nota = form.elements.nota.value;
    const erro = document.getElementById("erroEditar");

    if (!nome) return (erro.textContent = "Informe o nome.");
    if (nota === "" || Number.isNaN(Number(nota))) return (erro.textContent = "Informe uma nota válida.");

    try {
        await enviarJson(`${API}/${jogadorEmEdicao.id}`, "PUT", { nome, posicao, nota });
        document.getElementById("dlgEditar").close();
        notificarAlteracao();
        mensagem("Jogador atualizado.");
    } catch (e) { erro.textContent = e.message; }
}

export function iniciarEdicao() {
    const dialogo = document.getElementById("dlgEditar");
    fecharAoClicarFora(dialogo);
    document.getElementById("formEditar").addEventListener("submit", salvarEdicao);
    document.getElementById("btnCancelarEditar").addEventListener("click", () => dialogo.close());
}

async function excluirJogador(jogador) {
    if (!confirm(`Excluir ${jogador.nome}?`)) return;
    try {
        await api(`${API}/${jogador.id}`, { method: "DELETE" });
        notificarAlteracao();
        mensagem("Jogador excluído.");
    } catch (erro) { mensagem(erro.message, "danger"); }
}
