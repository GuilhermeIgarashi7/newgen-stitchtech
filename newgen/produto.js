class Produto {
    constructor({
        id = 0,
        nome = "",
        codigoBarras = "",
        foto = "",
        unidade = "un",
        estoqueMinimo = 0,
        controlaLote = false,
        quantidade = 0,
        lotes = []
    } = {}) {
        this.id = id;
        this.nome = nome;
        this.codigoBarras = codigoBarras;
        this.foto = foto;               // imagem em base64 (data URL)
        this.unidade = unidade;
        this.estoqueMinimo = estoqueMinimo;
        this.controlaLote = controlaLote;
        this.quantidade = quantidade;   // saldo atual (só muda por entrada/baixa)
        this.lotes = lotes;             // preparado para o controle por lote
    }

    // Regra de status (texto da tela de cadastro):
    // quantidade <= mínimo          → CRITICO (vermelho)
    // quantidade <= dobro do mínimo → BAIXO   (amarelo)
    // acima disso                   → OK      (verde)
    static calcularStatus(produto) {
        if (produto.quantidade <= produto.estoqueMinimo) return "CRITICO";
        if (produto.quantidade <= produto.estoqueMinimo * 2) return "BAIXO";
        return "OK";
    }
}