import { api, enviarJson } from "./api.js";
import { MINIMO_JOGADORES, contarPosicao, distribuirTimes } from "./sorteio.js";
import { EVENTO_SELECAO, fecharAoClicarFora, mensagem, notificarAlteracao } from "./ui.js";

// Estado em memória: quem está em cada time no momento
const TIMES = { time1: [], time2: [], time3: [] };
const NOMES = { time1: "TIME 1", time2: "TIME 2", time3: "TIME 3" };
const ICONES = { G: "🧤", Z: "🛡️", M: "🎯", A: "🔥" };
const ICONES_TIME = { time1: "🔵", time2: "🔴", time3: "🟢" };
const LINHAS_CAMPO = [["G", "85%"], ["Z", "65%"], ["M", "45%"], ["A", "20%"]]; // posição -> altura no campo

// O sorteio fica guardado neste aparelho (só do dia de hoje) para não se perder ao recarregar a página.
const CHAVE_TIMES = "futebol:times";
const hoje = () => new Date().toLocaleDateString("sv-SE"); // AAAA-MM-DD no fuso do aparelho

function salvarTimes() {
    try { localStorage.setItem(CHAVE_TIMES, JSON.stringify({ dia: hoje(), times: TIMES })); } catch { /* sem armazenamento */ }
}

function restaurarTimes() {
    try {
        const salvo = JSON.parse(localStorage.getItem(CHAVE_TIMES) || "null");
        if (!salvo || salvo.dia !== hoje()) return;
        Object.keys(TIMES).forEach((chave) => {
            TIMES[chave] = Array.isArray(salvo.times?.[chave]) ? salvo.times[chave] : [];
        });
    } catch { /* dado corrompido: ignora */ }
}

// Usado no fechamento do dia: quem está no time ("TIME 1", ...) neste momento
export function jogadoresDoTime(nomeTime) {
    const chave = Object.keys(NOMES).find((k) => NOMES[k] === nomeTime);
    return chave ? [...TIMES[chave]] : [];
}

function lerSelecionados() {
    return Array.from(document.querySelectorAll(".disponivel:checked"), (c) => ({
        id: c.dataset.id,
        nome: c.dataset.nome,
        nota: Number(c.dataset.nota) || 0,
        posicao: c.dataset.posicao,
    }));
}

function atualizarContador() {
    document.getElementById("contadorSelecionados").textContent =
        `Selecionados: ${document.querySelectorAll(".disponivel:checked").length}`;
}

// ---------- SORTEIO ----------
function sortear() {
    const jogadores = lerSelecionados();
    if (jogadores.length < MINIMO_JOGADORES) {
        return mensagem(`Selecione pelo menos ${MINIMO_JOGADORES} jogadores (selecionados: ${jogadores.length}).`, "warning");
    }
    const equilibrar = document.getElementById("equilibrarNotas").checked;
    [TIMES.time1, TIMES.time2, TIMES.time3] = distribuirTimes(jogadores, { numTimes: 3, equilibrarNotas: equilibrar });
    salvarTimes();
    renderizarTodosTimes();

    const goleiros = contarPosicao(jogadores, "G");
    if (goleiros === 3) mensagem("Times sorteados!");
    else mensagem(`Times sorteados, mas há ${goleiros} goleiro(s) selecionado(s). O ideal é 3, um por time.`, "warning");
}

// ---------- CAMPO ----------
function criarJogadorNoCampo(jogador, topo, esquerda, origem) {
    const div = document.createElement("div");
    div.className = "jogador-campo";
    div.draggable = true;
    div.style.top = topo;
    div.style.left = esquerda;

    const icone = document.createElement("div");
    icone.className = "icone-jogador";
    icone.textContent = ICONES[jogador.posicao] || "⚽";
    const nome = document.createElement("div");
    nome.className = "nome-jogador";
    nome.textContent = jogador.nome;
    div.append(icone, nome);

    div.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("id", String(jogador.id));
        e.dataTransfer.setData("origem", origem);
        div.classList.add("dragging");
    });
    div.addEventListener("dragend", () => div.classList.remove("dragging"));
    // Toque/clique: funciona no celular, onde arrastar e soltar do navegador não existe
    div.addEventListener("click", () => abrirMover(jogador, origem));
    return div;
}

function renderizarTime(chave, numero) {
    const campo = document.getElementById(chave);
    const jogadores = TIMES[chave];
    campo.replaceChildren();

    const soma = jogadores.reduce((total, j) => total + (Number(j.nota) || 0), 0);
    document.getElementById(`notaTime${numero}`).textContent = `Nota: ${soma.toFixed(1)}`;

    LINHAS_CAMPO.forEach(([posicao, topo]) => {
        const grupo = jogadores.filter((j) => j.posicao === posicao);
        grupo.forEach((jogador, i) => {
            // espalha igualmente na linha, então nunca ficam empilhados
            const esquerda = `${((i + 1) / (grupo.length + 1)) * 100}%`;
            campo.append(criarJogadorNoCampo(jogador, topo, esquerda, chave));
        });
    });
}

function renderizarTodosTimes() {
    Object.keys(TIMES).forEach((chave, i) => renderizarTime(chave, i + 1));
}

function moverJogador(id, origem, destino) {
    if (!TIMES[origem] || !TIMES[destino] || origem === destino) return null;
    const jogador = TIMES[origem].find((j) => String(j.id) === String(id));
    if (!jogador) return null;
    TIMES[origem] = TIMES[origem].filter((j) => String(j.id) !== String(id));
    TIMES[destino].push(jogador);
    salvarTimes();
    renderizarTodosTimes();
    return jogador;
}

function ativarArrastar() {
    document.querySelectorAll(".campo").forEach((campo) => {
        campo.addEventListener("dragover", (e) => e.preventDefault());
        campo.addEventListener("drop", (e) => {
            e.preventDefault();
            moverJogador(e.dataTransfer.getData("id"), e.dataTransfer.getData("origem"), campo.id);
        });
    });
}

// Modal "Mover para..." (toque)
function abrirMover(jogador, origem) {
    document.getElementById("tituloMover").textContent = `Mover ${jogador.nome}`;
    const opcoes = document.getElementById("opcoesMover");
    opcoes.replaceChildren();
    Object.keys(TIMES).filter((chave) => chave !== origem).forEach((destino) => {
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "btn btn-outline-dark btn-lg";
        botao.textContent = `${ICONES_TIME[destino]} ${NOMES[destino]}`;
        botao.addEventListener("click", () => {
            document.getElementById("dlgMover").close();
            if (moverJogador(jogador.id, origem, destino)) mensagem(`${jogador.nome} foi para o ${NOMES[destino]}.`);
        });
        opcoes.append(botao);
    });
    document.getElementById("dlgMover").showModal();
}

// ---------- AÇÕES ----------
function idsEmCampo() {
    return Object.values(TIMES).flat().map((j) => j.id);
}

async function registrarJogos() {
    const ids = idsEmCampo();
    if (!ids.length) return mensagem("Faça o sorteio antes de registrar os jogos.", "warning");
    if (!confirm(`Registrar +1 jogo para ${ids.length} jogadores?`)) return;
    try {
        await enviarJson("/jogos/registrar", "POST", { jogadores: ids });
        notificarAlteracao();
        mensagem("Jogos registrados!");
    } catch (erro) { mensagem(erro.message, "danger"); }
}

async function salvarVitoria(nomeTime) {
    try {
        await enviarJson("/partidas", "POST", { nome_time: nomeTime });
        notificarAlteracao();
        mensagem(`Vitória do ${nomeTime} salva!`);
    } catch (erro) { mensagem(erro.message, "danger"); }
}

export async function carregarRankingTimes() {
    const ranking = await api("/partidas/ranking");
    const area = document.getElementById("rankingTimes");
    if (!ranking.length) {
        area.textContent = "Nenhuma vitória registrada hoje.";
        return;
    }
    const fragmento = document.createDocumentFragment();
    ranking.forEach((t) => {
        const card = document.createElement("div");
        card.className = "card-ranking";
        card.textContent = `🏆 ${t.nome_time} - ${t.vitorias} ${Number(t.vitorias) === 1 ? "vitória" : "vitórias"}`;
        fragmento.append(card);
    });
    area.replaceChildren(fragmento);
}

const pausa = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

function baixarCanvas(canvas, nomeArquivo) {
    const link = document.createElement("a");
    link.download = nomeArquivo;
    link.href = canvas.toDataURL("image/png");
    document.body.append(link);
    link.click();
    link.remove();
}

// Uma imagem por time (time-1-AAAA-MM-DD.png, ...), sem o botão "Vitória" aparecendo na foto.
async function baixarImagemTimes() {
    if (!idsEmCampo().length) return mensagem("Faça o sorteio antes de baixar as imagens.", "warning");
    if (!window.html2canvas) return mensagem("Biblioteca de imagem não carregou. Recarregue a página.", "danger");

    const botao = document.getElementById("btnImagemTimes");
    botao.disabled = true;
    try {
        let baixadas = 0;
        for (const [chave, nomeTime] of Object.entries(NOMES)) {
            if (!TIMES[chave].length) continue; // time vazio não gera imagem
            const cartao = document.getElementById(chave).closest(".card-time");
            const canvas = await window.html2canvas(cartao, {
                backgroundColor: "#ffffff",
                scale: 2,
                ignoreElements: (elemento) => elemento.classList.contains("btn-vitoria"),
            });
            baixarCanvas(canvas, `${nomeTime.toLowerCase().replace(" ", "-")}-${hoje()}.png`);
            baixadas += 1;
            await pausa(500); // o navegador recusa downloads colados um no outro
        }
        mensagem(`${baixadas} ${baixadas === 1 ? "imagem baixada" : "imagens baixadas (uma por time)"}.`);
    } catch {
        mensagem("Não foi possível gerar as imagens dos times.", "danger");
    } finally {
        botao.disabled = false;
    }
}

export function iniciarTimes() {
    document.addEventListener(EVENTO_SELECAO, atualizarContador);
    document.getElementById("btnSortear").addEventListener("click", sortear);
    document.getElementById("btnRegistrarJogos").addEventListener("click", registrarJogos);
    document.getElementById("btnImagemTimes").addEventListener("click", baixarImagemTimes);
    document.querySelectorAll("[data-time]").forEach((el) =>
        el.addEventListener("click", () => salvarVitoria(el.dataset.time))
    );
    const dialogoMover = document.getElementById("dlgMover");
    fecharAoClicarFora(dialogoMover);
    document.getElementById("btnCancelarMover").addEventListener("click", () => dialogoMover.close());
    ativarArrastar();
    restaurarTimes();
    renderizarTodosTimes();
    atualizarContador();
}
