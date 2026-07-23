const API_JOGADORES = "/jogadores";

function mostrarMensagem(texto, tipo = "success") {
    let area = document.getElementById("mensagem");

    if (!area) {
        area = document.createElement("div");
        area.id = "mensagem";
        area.className = "alert d-none";
        document.querySelector("main.container").prepend(area);
    }

    area.className = `alert alert-${tipo}`;
    area.textContent = texto;

    window.clearTimeout(mostrarMensagem.timeoutId);
    mostrarMensagem.timeoutId = window.setTimeout(() => {
        area.className = "alert d-none";
    }, 4000);
}

async function requisicao(url, opcoes = {}) {
    const resposta = await fetch(url, opcoes);
    const conteudo = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
        throw new Error(conteudo.erro || `Erro HTTP ${resposta.status}`);
    }

    return conteudo;
}

function criarBotao(texto, classe, aoClicar, titulo = "") {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = `btn ${classe} btn-sm`;
    botao.textContent = texto;
    botao.title = titulo || texto;
    botao.addEventListener("click", aoClicar);
    return botao;
}

function criarCelula(texto) {
    const celula = document.createElement("td");
    celula.textContent = texto;
    return celula;
}

function criarCelulaEstatistica(jogador, campo) {
    const celula = document.createElement("td");
    celula.append(document.createTextNode(`${jogador[campo] ?? 0} `));
    celula.append(
        criarBotao("+", "btn-success", () => alterar(jogador.id, campo, "somar"), "Somar"),
        document.createTextNode(" "),
        criarBotao("−", "btn-danger", () => alterar(jogador.id, campo, "subtrair"), "Subtrair")
    );
    return celula;
}

function criarLinhaJogador(jogador) {
    const linha = document.createElement("tr");
    linha.append(criarCelula(jogador.nome));

    if (jogador.posicao !== "G") {
        linha.append(criarCelula(jogador.posicao));
        linha.append(criarCelulaEstatistica(jogador, "gols"));
    }

    linha.append(criarCelulaEstatistica(jogador, "jogos"));
    linha.append(criarCelulaEstatistica(jogador, "vitorias"));

    const acoes = document.createElement("td");
    acoes.append(
        criarBotao("Editar", "btn-primary", () => editarJogador(jogador)),
        document.createTextNode(" "),
        criarBotao("Excluir", "btn-danger", () => excluirJogador(jogador.id))
    );
    linha.append(acoes);
    return linha;
}

async function carregarJogadores() {
    try {
        const jogadores = await requisicao(API_JOGADORES);
        const tabelaJogadores = document.getElementById("listaJogadores");
        const tabelaGoleiros = document.getElementById("listaGoleiros");
        const fragmentoLinha = document.createDocumentFragment();
        const fragmentoGoleiro = document.createDocumentFragment();

        jogadores.forEach((jogador) => {
            const linha = criarLinhaJogador(jogador);
            (jogador.posicao === "G" ? fragmentoGoleiro : fragmentoLinha).append(linha);
        });

        tabelaJogadores.replaceChildren(fragmentoLinha);
        tabelaGoleiros.replaceChildren(fragmentoGoleiro);