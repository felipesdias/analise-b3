
const fs = require('fs').promises;
const ss = require('simple-statistics');

;(async () => {
    const listaPapeis = await fs.readdir(__dirname + '/historico');

    const papeis = {};

    for (const papelFile of listaPapeis) {
        const papel = papelFile.split('.')[0];
        papeis[papel] = JSON.parse(await fs.readFile(__dirname + `/historico/${papelFile}`, 'utf-8'));
    }

    const papeisNames = Object.keys(papeis);

    for (let i=0; i<papeisNames.length; i++) {
        const papel1 = papeisNames[i];
        for (let j=i+1; j<papeisNames.length; j++) {
            const papel2 = papeisNames[j];
            const correlacao = ss.sampleCorrelation(
                papeis[papel1].map(x => x.fechamento),
                papeis[papel2].map(x => x.fechamento)
            );

            
            if (correlacao > 0.9) {
                const lines = [`${papel1};${papel2}`];
                for(let i=0; i<papeis[papel1].length; i++) {
                    lines.push(`${String(papeis[papel1][i].fechamento).replace('.', ',')};${String(papeis[papel2][i].fechamento).replace('.', ',')}`);
                }
                fs.writeFile(`${__dirname}/relatorios/${papel1}-${papel2}.csv`, lines.join('\n'), 'utf-8');
            }
        }
    }
})();