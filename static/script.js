const API = "/jogadores";

function mensagem(texto, tipo = "success") {
    const area = document.getElementById("mensagem");
    area.className = `alert alert-${tipo}`;
    area.textContent = texto;
    clearTimeout(mensagem.timer);
    mensagem.timer = setTimeout(() => (area.className = "alert d-none"), 3500);
}

async function api(url, opcoes = {}) {
    const resposta = await fetch(url, opcoes);
    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok) throw new Error(dados.erro || `Erro HTTP ${resposta.status}`);
    return dados;
}

function botao(texto, estilo, acao, titulo) {
    const elemento = document.createElement("button");
    elemento.type = "button";
    elemento.className = `btn ${estilo} btn-sm`;
    elemento.textContent = texto;
    elemento.title = titulo || texto;
    elemento.addEventListener("click", acao);
    return elemento;
}

function celulaEstatistica(jogador, campo) {
    const celula = document.createElement("td");
    celula.append(document.createTextNode(`${jogador[campo]} `));
    celula.append(botao("+", "btn-success", () => alterar(jogador.id, campo, "somar"), `Somar ${campo}`));
    celula.append(document.createTextNode(" "));
    celula.append(botao("−", "btn-outline-danger", () => alterar(jogador.id, campo, "subtrair"), `Subtrair ${campo}`));
    return celula;
}

function linhaJogador(jogador) {
    const linha = document.createElement("tr");
    [jogador.nome, jogador.posicao].forEach((valor) => {
        const celula = document.createElement("td");
        celula.textContent = valor;
        linha.append(celula);
    });
    linha.append(celulaEstatistica(jogador, "gols"));
    linha.append(celulaEstatistica(jogador, "jogos"));
    linha.append(celulaEstatistica(jogador, "vitorias"));
    const nota = document.createElement("td"); nota.textContent = jogador.nota; linha.append(nota);
    const acoes = document.createElement("td");
    acoes.append(botao("Editar", "btn-primary", () => editarJogador(jogador)));
    acoes.append(document.createTextNode(" "));
    acoes.append(botao("Excluir", "btn-danger", () => excluirJogador(jogador.id)));
    linha.append(acoes);
    return linha;
}

async function carregarJogadores() {
    try {
        const jogadores = await api(API);
        const fragmento = document.createDocumentFragment();
        jogadores.forEach((jogador) => fragmento.append(linhaJogador(jogador)));
        document.getElementById("listaJogadores").replaceChildren(fragmento);
    } catch (erro) { mensagem(erro.message, "danger"); }
}

async function adicionarJogador() {
    const nome = document.getElementById("nome").value.trim();
    const posicao = document.getElementById("posicao").value;
    const nota = document.getElementById("nota").value;
    if (!nome || nota === "") return mensagem("Informe nome e nota.", "warning");
    try {
        await api(API, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({nome, posicao, nota})});
        document.getElementById("nome").value = ""; document.getElementById("nota").value = "";
        await atualizar(); mensagem("Jogador adicionado.");
    } catch (erro) { mensagem(erro.message, "danger"); }
}

async function alterar(id, campo, acao) {
    try {
        await api(`${API}/${id}/estatistica`, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({campo, acao})});
        await atualizar();
    } catch (erro) { mensagem(erro.message, "danger"); }
}

async function editarJogador(jogador) {
    const nome = prompt("Nome:", jogador.nome);
    if (nome === null || !nome.trim()) return;
    const posicao = prompt("Posição (A, M, Z ou G):", jogador.posicao);
    if (posicao === null || !posicao.trim()) return;
    const nota = prompt("Nota:", jogador.nota);
    if (nota === null || nota === "" || Number.isNaN(Number(nota))) return mensagem("Informe uma nota válida.", "warning");
    try {
        await api(`${API}/${jogador.id}`, {method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify({nome, posicao, nota})});
        await atualizar(); mensagem("Jogador atualizado.");
    } catch (erro) { mensagem(erro.message, "danger"); }
}

async function excluirJogador(id) {
    if (!confirm("Deseja excluir este jogador?")) return;
    try { await api(`${API}/${id}`, {method: "DELETE"}); await atualizar(); mensagem("Jogador excluído."); }
    catch (erro) { mensagem(erro.message, "danger"); }
}

async function carregarRanking(tipo, destino, campo) {
    const ranking = await api(`/ranking/${tipo}`);
    const fragmento = document.createDocumentFragment();
    ranking.forEach((jogador, indice) => {
        const item = document.createElement("div"); item.className = "ranking-item";
        const nome = document.createElement("span"); nome.textContent = `${indice + 1}º ${jogador.nome}`;
        const valor = document.createElement("strong"); valor.textContent = `${jogador[campo]} ${campo}`;
        item.append(nome, valor); fragmento.append(item);
    });
    document.getElementById(destino).replaceChildren(fragmento);
}

async function atualizar() {
    try { await Promise.all([carregarJogadores(), carregarRanking("artilheiros", "rankingArtilheiros", "gols"), carregarRanking("vitoriosos", "rankingVitoriosos", "vitorias")]); }
    catch (erro) { mensagem(erro.message, "danger"); }
}

function gerarImagem(tipo) { window.open(`/top10-imagem/${tipo}`, "_blank", "noopener"); }
window.addEventListener("DOMContentLoaded", atualizar);
