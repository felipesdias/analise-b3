const fetch = require('node-fetch');
const fs = require('fs').promises;

const ONE_DAY = 1000 * 60 * 60 * 24;

function toNumber(str) {
    return Number(str.toUpperCase().replace(/\./g, '').replace(/\,/g, '.').replace(/[A-Z]/g, ''));
}

function convertVolume(str) {
    const letters = str.toUpperCase().split('');
    const nK = letters.filter(x => x === 'K').length;
    const nM = letters.filter(x => x === 'M').length;

    const volume = toNumber(str);

    return volume * (1000 ** nK) * (1000000 ** nM);
}

function toTimestamp(str) {
    [day, month, year] = str.split('/')
    return new Date(year, month - 1, day, 12, 0, 0, 0).getTime();
}

function convertToLocalData(data) {
    return {
        data: data[0].display,
        timestamp: toTimestamp(data[0].display),
        abertura: toNumber(data[1]),
        fechamento: toNumber(data[2]),
        variacao: toNumber(data[3]),
        minimo: toNumber(data[4]),
        maximo: toNumber(data[5]),
        volume: convertVolume(data[6])
    }
}

async function downloadHistorico(papel) {
    papel = papel.toUpperCase();
    const pathFile = __dirname + `/historico/${papel}.json`;

    const endDate = new Date(new Date().getTime() - ONE_DAY);
    let startDate = new Date(2015, 0, 1);

    const [f_dia, f_mes, f_ano] = endDate.toLocaleString().split(' ')[0].split('-').reverse();
    let [i_dia, i_mes, i_ano] = ['01', '01', '2015'];

    let historico = [];


    try {
        const historicoText = await fs.readFile(pathFile, 'utf-8');
        historico = JSON.parse(historicoText);
        const ultimoDia = historico[historico.length - 1];
        if (ultimoDia) {
            startDate = new Date(ultimoDia.timestamp + ONE_DAY);
            [i_dia, i_mes, i_ano] = startDate.toLocaleString().split(' ')[0].split('-').reverse();
        }
    } catch(e) {
        if (!e.message.includes('no such file or directory'))
            throw e;
    }


    if (startDate >= endDate) {
        console.log(`${papel} já está atualizado`);
    } else {
        console.log(`Download ${papel}: ${[i_dia, i_mes, i_ano].join('/')} até ${[f_dia, f_mes, f_ano].join('/')}`);

        const resp = await fetch("https://www.infomoney.com.br/wp-admin/admin-ajax.php", {
            "headers": {
                "accept": "application/json, text/javascript, */*; q=0.01",
                "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                "sec-ch-ua": "\"Chromium\";v=\"86\", \"\\\"Not\\\\A;Brand\";v=\"99\", \"Google Chrome\";v=\"86\"",
                "sec-ch-ua-mobile": "?0",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-requested-with": "XMLHttpRequest"
            },
            "referrer": "https://www.infomoney.com.br/cotacoes/magazine-luiza-mglu3/historico/",
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": `page=0&numberItems=99999&initialDate=${i_dia}%2F${i_mes}%2F${i_ano}&finalDate=${f_dia}%2F${f_mes}%2F${f_ano}&action=more_quotes_history&quotes_history_nonce=f2f86ac0c7&symbol=${papel}`,
            "method": "POST",
            "mode": "cors"
        });

        const novoHistorico = await resp.json();

        const historicoCompleto = [...historico, ...novoHistorico.map(convertToLocalData)].sort((a, b) => a.timestamp - b.timestamp);
        await fs.writeFile(pathFile, JSON.stringify(historicoCompleto, null, 4), 'utf-8');
    }
}

;(async () => {
    const papeis = JSON.parse(await fs.readFile(__dirname + '/papeis.json', 'utf-8'));
    
    for (const papel of papeis) {
        await downloadHistorico(papel);
    }
})();