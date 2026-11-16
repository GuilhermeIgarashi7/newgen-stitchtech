// Registro do histórico. Não tem "id" de propósito:
// o IndexedDB gera o id automaticamente (autoIncrement).
class Movimentacao {
    constructor({ produtoId, tipo, quantidade, saldoApos, observacao = "", data = new Date().toISOString() }) {
        this.produtoId = produtoId;
        this.tipo = tipo;             // "ENTRADA" ou "BAIXA"
        this.quantidade = quantidade;
        this.saldoApos = saldoApos;   // saldo depois da movimentação
        this.observacao = observacao;
        this.data = data;
    }
}