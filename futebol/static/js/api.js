export const EVENTO_NAO_AUTORIZADO = "sessao:nao-autorizada";

export async function api(url, opcoes = {}) {
    const resposta = await fetch(url, opcoes);
    const dados = await resposta.json().catch(() => ({}));
    if (resposta.status === 401 && !url.startsWith("/auth/login")) {
        document.dispatchEvent(new CustomEvent(EVENTO_NAO_AUTORIZADO)); // sessão expirou ou não é admin
    }
    if (!resposta.ok) throw new Error(dados.erro || `Erro HTTP ${resposta.status}`);
    return dados;
}

export function enviarJson(url, metodo, corpo) {
    return api(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
    });
}

// Baixa um arquivo (ex.: PNG). Se o servidor devolver erro em JSON, ele vira exceção
// e aparece na tela, em vez de abrir uma aba em branco com o erro.
export async function baixarArquivo(url, nomeArquivo) {
    const resposta = await fetch(url);
    if (!resposta.ok) {
        const dados = await resposta.json().catch(() => ({}));
        throw new Error(dados.erro || `Erro HTTP ${resposta.status}`);
    }
    const href = URL.createObjectURL(await resposta.blob());
    const link = document.createElement("a");
    link.href = href;
    // usa o nome que o servidor sugere (ex.: top10-2026-11-19.png, com a data)
    const sugerido = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(resposta.headers.get("Content-Disposition") || "");
    link.download = sugerido ? decodeURIComponent(sugerido[1]) : nomeArquivo;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
}
