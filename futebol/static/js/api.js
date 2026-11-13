export async function api(url, opcoes = {}) {
    const resposta = await fetch(url, opcoes);
    const dados = await resposta.json().catch(() => ({}));
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
    link.download = nomeArquivo;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
}
