
const fs = require('fs').promises;
const ss = require('simple-statistics');

;(async () => {
    await fs.mkdir(__dirname + '/historico');
    
    const listaPapeis = await fs.readdir(__dirname + '/historico');

    const papeis = {};

    for (const papelFile of listaPapeis) {
        const papel = papelFile.split('.')[0];
        papeis[papel] = JSON.parse(await fs.readFile(__dirname + `/historico/${papelFile}`, 'utf-8'));
    }

    const papeisNames = Object.keys(papeis);

    const correlacoes = [];

    for (let i=0; i<papeisNames.length; i++) {
        const papel1 = papeisNames[i];
        for (let j=i+1; j<papeisNames.length; j++) {
            const papel2 = papeisNames[j];
            const correlacao = ss.sampleCorrelation(
                papeis[papel1].map(x => x.fechamento),
                papeis[papel2].map(x => x.fechamento)
            );

            const covariancia = ss.sampleCovariance(
                papeis[papel1].map(x => x.fechamento),
                papeis[papel2].map(x => x.fechamento)
            );

            correlacoes.push([correlacao, `${papel1} ${papel2} => ${correlacao.toFixed(2)}; ${covariancia.toFixed(2)}`]);
        }
    }

    console.log(correlacoes.sort((a, b) => b[0] - a[0]).map(x => x[1]).join('\n'))
})();