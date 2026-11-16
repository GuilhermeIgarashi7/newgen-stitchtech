class ControleBase {
    // Conexão única compartilhada (igual ao static LiteDatabase do C#)
    static db = null;
    static nomeDoBanco = "ESTOQUE_DB";
    static versaoDoBanco = 1;

    constructor(nomeDaTabela) {
        this.nomeDaTabela = nomeDaTabela;
    }

    abrirBanco() {
        return new Promise((resolve, reject) => {
            if (ControleBase.db) {
                resolve(ControleBase.db);
                return;
            }

            const request = indexedDB.open(ControleBase.nomeDoBanco, ControleBase.versaoDoBanco);

            // Cria as "tabelas" na primeira execução
            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                if (!db.objectStoreNames.contains("Produtos")) {
                    db.createObjectStore("Produtos", { keyPath: "id", autoIncrement: true });
                }
                if (!db.objectStoreNames.contains("Movimentacoes")) {
                    db.createObjectStore("Movimentacoes", { keyPath: "id", autoIncrement: true });
                }
            };

            request.onsuccess = (event) => {
                ControleBase.db = event.target.result;
                ControleBase.db.onversionchange = () => {
                    ControleBase.db.close();
                    ControleBase.db = null;
                };
                resolve(ControleBase.db);
            };

            request.onerror = () => reject(request.error);
        });
    }
}