import { api, enviarJson } from "./api.js";
import { jogadoresDoTime } from "./times.js";
import { fecharAoClicarFora, mensagem, notificarAlteracao } from "./ui.js";

let lideres = [];       // times empatados na frente (normalmente 1)
let placar = {};        // { "TIME 2": 3, ... }
let timeEscolhido = null;

// ---------- status do dia (público) ----------
export async function carregarDia() {
    const dia = await api("/dia/status");
    document.getElementById("btnFecharDia").hidden = dia.fechado;
    document.getElementById("btnDesfazerDia").hidden = !dia.fechado;
    document.getElementById("statusDia").textContent = dia.fechado
        ? `✅ Dia fechado: ${dia.nome_time} (+1 vitória para ${dia.jogadores.join(", ")})`
        : "";
}

// ---------- janela de confirmação ----------
function jogadoresParaLista(nomeTime) {
    const doSorteio = jogadoresDoTime(nomeTime);
    if (doSorteio.length) {
        // goleiro não entra no ranking de vitórias, então vem desmarcado (dá para marcar)
        return { lista: doSorteio, marcado: (j) => j.posicao !== "G", aviso: "" };
    }
    // sem sorteio neste aparelho: o admin marca quem jogou
    const todos = Array.from(document.querySelectorAll(".disponivel"), (c) => ({
        id: c.dataset.id, nome: c.dataset.nome, posicao: c.dataset.posicao,
    })).sort((a, b) => a.nome.localeCompare(b.nome));
    return {
        lista: todos,
        marcado: () => false,
        aviso: `Não achei o sorteio do ${nomeTime} neste aparelho. Marque quem jogou nesse time.`,
    };
}

function atualizarResumo() {
    const marcados = document.querySelectorAll("#listaFechar input:checked").length;
    document.getElementById("resumoFechar").textContent =
        marcados === 1 ? "1 jogador receberá +1 vitória." : `${marcados} jogadores receberão +1 vitória.`;
    document.getElementById("btnConfirmarFechar").disabled = marcados === 0;
}

function desenharLista() {
    const { lista, marcado, aviso } = jogadoresParaLista(timeEscolhido);
    document.getElementById("avisoFechar").textContent = aviso;
    const fragmento = document.createDocumentFragment();
    lista.forEach((jogador) => {
        const rotulo = document.createElement("label");
        rotulo.className = "item-fechar";
        const caixa = document.createElement("input");
        caixa.type = "checkbox";
        caixa.className = "form-check-input";
        caixa.value = jogador.id;
        caixa.checked = marcado(jogador);
        caixa.addEventListener("change", atualizarResumo);
        rotulo.append(caixa, document.createTextNode(` ${jogador.nome}`));
        if (jogador.posicao === "G") {
            const etiqueta = document.createElement("span");
            etiqueta.className = "etiqueta-goleiro";
            etiqueta.textContent = "🧤 goleiro";
            rotulo.append(etiqueta);
        }
        fragmento.append(rotulo);
    });
    document.getElementById("listaFechar").replaceChildren(fragmento);
    document.getElementById("tituloListaFechar").textContent = `Quem recebe +1 vitória no ${timeEscolhido}:`;
    atualizarResumo();
}

function desenharEscolhaDeTime() {
    const area = document.getElementById("escolhaTime");
    area.replaceChildren();
    if (lideres.length < 2) return;
    const titulo = document.createElement("div");
    titulo.className = "fw-bold mb-1";
    titulo.textContent = "Empate no primeiro lugar. Qual time fica com o dia?";
    area.append(titulo);
    lideres.forEach((time) => {
        const rotulo = document.createElement("label");
        rotulo.className = "item-fechar";
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "timeCampeao";
        radio.className = "form-check-input";
        radio.checked = time === timeEscolhido;
        radio.addEventListener("change", () => { timeEscolhido = time; desenharLista(); });
        rotulo.append(radio, document.createTextNode(` ${time}`));
        area.append(rotulo);
    });
}

async function abrirFechamento() {
    try {
        const ranking = await api("/partidas/ranking");
        if (!ranking.length) {
            return mensagem("Registre ao menos uma vitória de time (botão Vitória) antes de fechar o dia.", "warning");
        }
        placar = Object.fromEntries(ranking.map((r) => [r.nome_time, Number(r.vitorias)]));
        const maximo = Math.max(...Object.values(placar));
        lideres = Object.keys(placar).filter((time) => placar[time] === maximo).sort();
        timeEscolhido = lideres[0];

        const unico = lideres.length === 1;
        document.getElementById("resumoLider").textContent = unico
            ? `${timeEscolhido} venceu ${maximo} ${maximo === 1 ? "partida" : "partidas"} hoje.`
            : `${lideres.join(" e ")} empataram com ${maximo} ${maximo === 1 ? "vitória" : "vitórias"}.`;
        desenharEscolhaDeTime();
        desenharLista();
        document.getElementById("dlgFechar").showModal();
    } catch (erro) { mensagem(erro.message, "danger"); }
}

async function confirmarFechamento() {
    const ids = Array.from(document.querySelectorAll("#listaFechar input:checked"), (c) => Number(c.value));
    const erro = document.getElementById("erroFechar");
    erro.textContent = "";
    try {
        await enviarJson("/dia/fechar", "POST", { nome_time: timeEscolhido, jogadores: ids });
        document.getElementById("dlgFechar").close();
        notificarAlteracao();
        mensagem(`+1 vitória para ${ids.length} ${ids.length === 1 ? "jogador" : "jogadores"} do ${timeEscolhido}.`);
    } catch (e) { erro.textContent = e.message; }
}

async function desfazerFechamento() {
    if (!confirm("Desfazer o fechamento de hoje? O +1 vitória será removido de quem recebeu.")) return;
    try {
        await enviarJson("/dia/desfazer", "POST", {});
        notificarAlteracao();
        mensagem("Fechamento desfeito.");
    } catch (erro) { mensagem(erro.message, "danger"); }
}

export function iniciarDia() {
    const dialogo = document.getElementById("dlgFechar");
    fecharAoClicarFora(dialogo);
    document.getElementById("btnFecharDia").addEventListener("click", abrirFechamento);
    document.getElementById("btnDesfazerDia").addEventListener("click", desfazerFechamento);
    document.getElementById("btnConfirmarFechar").addEventListener("click", confirmarFechamento);
    document.getElementById("btnCancelarFechar").addEventListener("click", () => dialogo.close());
}
