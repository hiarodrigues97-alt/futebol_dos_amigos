export const EVENTO_ALTERACAO = "dados:alterados";

export function notificarAlteracao() {
    document.dispatchEvent(new CustomEvent(EVENTO_ALTERACAO));
}

let temporizador;
export function mensagem(texto, tipo = "success") {
    const area = document.getElementById("mensagem");
    area.className = `alert alert-${tipo}`;
    area.textContent = texto;
    clearTimeout(temporizador);
    temporizador = setTimeout(() => (area.className = "alert d-none"), 3500);
}

export function botao(texto, estilo, acao, titulo) {
    const elemento = document.createElement("button");
    elemento.type = "button";
    elemento.className = `btn ${estilo} btn-sm`;
    elemento.textContent = texto;
    elemento.title = titulo || texto;
    elemento.addEventListener("click", acao);
    return elemento;
}
