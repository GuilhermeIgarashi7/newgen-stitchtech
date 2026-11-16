class ControleBase {
    static db = null;

    constructor(nomeDaTabela) {
        this.nomeDoBanco = "SESI_DB";
        this.versaoDoBanco = 1;
        this.nomeDaTabela = nomeDaTabela;
    }

    // Abre ou reaproveita a conexão com o IndexedDB (equivalente ao new LiteDatabase)
    abrirBanco() {
        return new Promise((resolve, reject) => {
            if (ControleBase.db) {
                resolve(ControleBase.db);
                return;
            }

            const request = indexedDB.open(this.nomeDoBanco, this.versaoDoBanco);

            // Executado na 1ª vez que o banco é criado ou quando versaoDoBanco aumenta
            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Cria a coleção "Clientes" com ID auto-incremento (equivalente ao [BsonId])
                if (!db.objectStoreNames.contains("Clientes")) {
                    db.createObjectStore("Clientes", { keyPath: "id", autoIncrement: true });
                }

                // DICA: Se criar novas tabelas no futuro (ex: "Produtos"),
                // adicione outro createObjectStore aqui e aumente this.versaoDoBanco para 2.
            };

            request.onsuccess = (event) => {
                ControleBase.db = event.target.result;

                ControleBase.db.onversionchange = () => {
                    ControleBase.db.close();
                    ControleBase.db = null;
                };

                resolve(ControleBase.db);
            };

            request.onerror = (event) => {
                reject("Erro ao abrir o banco de dados: " + event.target.error);
            };
        });
    }

    // Métodos base (equivalentes aos métodos virtual do C#)
    async criarOuAtualizar(registro) {}
    async ler(id) { return null; }
    async lerTodos() { return []; }
    async apagar(id) {}
}