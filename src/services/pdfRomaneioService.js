import * as pdfjsLib from 'pdfjs-dist';
import { formatarCNPJ, limparNomeEmpresa, PEDREIRAS_CEARA, MATERIAIS_POR_PEDREIRA, consultarCNPJReceita, sanitizarNumeroBloco, isClienteComBarraNoBloco } from './agendamentoService.js';

// Configurar o worker do PDF.js para funcionar perfeitamente em navegadores
try {
  if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
  }
} catch (e) {
  console.warn('[PDF.js] Não foi possível configurar workerSrc via CDN:', e);
}

/**
 * Converte um valor em string monetária brasileira para número float (ex: "3.617,60" -> 3617.6)
 */
export const converterValorMonetarioParaFloat = (valStr) => {
  if (!valStr) return 0;
  const limpo = String(valStr).replace(/[^\d,-]/g, '').replace(',', '.');
  const num = parseFloat(limpo);
  return isNaN(num) ? 0 : num;
};

/**
 * Extrai o texto completo de um arquivo PDF (File ou ArrayBuffer),
 * agrupando os blocos de texto por linha (coordenada Y) para preservar tabelas.
 */
export const extrairTextoDoPdf = async (arquivoOuBuffer) => {
  let arrayBuffer;
  if (arquivoOuBuffer instanceof ArrayBuffer) {
    arrayBuffer = arquivoOuBuffer;
  } else if (arquivoOuBuffer?.arrayBuffer) {
    arrayBuffer = await arquivoOuBuffer.arrayBuffer();
  } else {
    throw new Error('Arquivo inválido para leitura do PDF.');
  }

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const totalPaginas = pdf.numPages;
  const paginasTexto = [];

  for (let i = 1; i <= totalPaginas; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    // Coletar itens com coordenadas válidas
    const validItems = [];
    for (const item of textContent.items) {
      if (!item.str || item.str.trim() === '') continue;
      validItems.push({
        str: item.str,
        x: item.transform[4],
        y: item.transform[5]
      });
    }

    // Ordenar itens por coordenada Y decrescente (do topo para o rodapé)
    validItems.sort((a, b) => b.y - a.y);

    // Agrupamento robusto por linha (clustering dinâmico por baseline)
    const TOLERANCIA_Y = 5.0; // tolerância para consolidar colunas da mesma linha
    const clustersLinhas = [];
    let linhaAtual = null;

    for (const item of validItems) {
      if (!linhaAtual) {
        linhaAtual = {
          ySum: item.y,
          count: 1,
          minY: item.y,
          maxY: item.y,
          avgY: item.y,
          items: [item]
        };
        clustersLinhas.push(linhaAtual);
      } else {
        const diffAvg = Math.abs(item.y - linhaAtual.avgY);
        const diffMinMax = Math.abs(item.y - linhaAtual.minY);

        if (diffAvg <= TOLERANCIA_Y || diffMinMax <= TOLERANCIA_Y) {
          linhaAtual.items.push(item);
          linhaAtual.ySum += item.y;
          linhaAtual.count++;
          linhaAtual.avgY = linhaAtual.ySum / linhaAtual.count;
          linhaAtual.minY = Math.min(linhaAtual.minY, item.y);
          linhaAtual.maxY = Math.max(linhaAtual.maxY, item.y);
        } else {
          linhaAtual = {
            ySum: item.y,
            count: 1,
            minY: item.y,
            maxY: item.y,
            avgY: item.y,
            items: [item]
          };
          clustersLinhas.push(linhaAtual);
        }
      }
    }

    // Para cada linha, ordenar itens por X crescente (esquerda para direita)
    const linhasTexto = clustersLinhas.map(l => {
      l.items.sort((a, b) => a.x - b.x);
      return l.items.map(it => it.str.trim()).join(' ');
    });

    paginasTexto.push(linhasTexto.join('\n'));
  }

  return paginasTexto.join('\n\n--- NOVA PAGINA ---\n\n');
};

// Lista linear de todos os materiais oficialmente cadastrados nas pedreiras Vermont
const TODOS_MATERIAIS_OFICIAIS = Object.entries(MATERIAIS_POR_PEDREIRA).flatMap(([pedId, mats]) =>
  mats.map(nome => ({
    nome,
    nomeUpper: nome.toUpperCase(),
    pedId
  }))
);

/**
 * Retorna a pedreira oficial responsável pela extração de um material específico
 */
export const obterPedreiraPorMaterial = (nomeMaterial) => {
  if (!nomeMaterial) return null;
  const matUpper = String(nomeMaterial).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  for (const [pedId, mats] of Object.entries(MATERIAIS_POR_PEDREIRA)) {
    for (const m of mats) {
      const mUpper = m.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      if (matUpper === mUpper || matUpper.includes(mUpper) || mUpper.includes(matUpper)) {
        const pedObj = PEDREIRAS_CEARA.find(p => p.id === pedId);
        return {
          id: pedId,
          nome: pedObj ? pedObj.nome : pedId
        };
      }
    }
  }
  return null;
};

/**
 * Normaliza e mapeia o texto bruto do material do Romaneio PDF para o nome oficial
 * cadastrado nas pedreiras da Vermont Mineração.
 * 
 * Exemplos:
 * - "QUARTZITO BEGE NAURIKA" -> "Naurika"
 * - "BASALTO PRETO NEGRESCO" -> "Negresco"
 * - "GRANITO NEGRESCO" -> "Negresco"
 * - "BASALTO NEGRESCO" -> "Negresco"
 * - "QUARTZITO BRANCO TAJ MAHAL" -> "Taj Mahal"
 * - "QUARTZITO TAJ MAHAL" -> "Taj Mahal"
 * - "GRANITO DEL MARE" -> "Del Mare"
 * - "QUARTZITO INFINITY BROWN" -> "Infinity Brown"
 * - "QUARTZITO ZITAN" -> "Zitan"
 */
export const normalizarMaterialVermont = (materialBruto, pedreiraId = '') => {
  if (!materialBruto) return 'Taj Mahal';
  const matLimpo = String(materialBruto).trim();
  const matUpper = matLimpo.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Regras diretas de materiais conhecidos
  if (matUpper.includes('CRISTALLO')) return 'Cristallo Absolut';
  if (matUpper.includes('NAURIKA')) return 'Naurika';
  if (matUpper.includes('RAFFINATO')) return 'Raffinato';
  if (matUpper.includes('GUINESS')) return 'Guiness';
  if (matUpper.includes('NOUVEAU')) return 'Nouveau';
  if (matUpper.includes('ZITAN')) return 'Zitan';
  if (matUpper.includes('SCENARIO')) return 'Scenario';
  if (matUpper.includes('NEGRESCO')) return 'Negresco';
  if (matUpper.includes('TAJ MAHAL') || matUpper.includes('TAJMAHAL')) return 'Taj Mahal';
  if (matUpper.includes('DEL MARE') || matUpper.includes('DELMARE')) return 'Del Mare';
  if (matUpper.includes('CHATEAU BLANC')) return 'Chateau Blanc';
  if (matUpper.includes('BRECCIA VIOLA')) return 'Breccia Viola';
  if (matUpper.includes('BRECCIA IMPERIALE')) return 'Breccia Imperiale';
  if (matUpper.includes('INFINITY BROWN')) return 'Infinity Brown';
  if (matUpper.includes('INFINITY BLACK')) return 'Infinity Black';
  if (matUpper.includes('ROMA IMPERIALE')) return 'Roma Imperiale';
  if (matUpper.includes('BLUE DEEP')) return 'Blue Deep';
  if (matUpper.includes('BLUE MARE')) return 'Blue Mare';
  if (matUpper.includes('BLUE ROMA')) return 'Blue Roma';
  if (matUpper.includes('TELLUS BLUE')) return 'Tellus Blue';
  if (matUpper.includes('ATLANTIC BLUE')) return 'Atlantic Blue';
  if (matUpper.includes('BROWN STRINGS')) return 'Brown Strings';
  if (matUpper.includes('JJ BROWN')) return 'JJ Brown';
  if (matUpper.includes('PANETTONE')) return 'Panettone';
  if (matUpper.includes('EVORA')) return 'Evora';
  if (matUpper.includes('KOUROS')) return 'Kouros';
  if (matUpper.includes('BROWNIE')) return 'Brownie';
  if (matUpper.includes('TELLUS')) return 'Tellus';
  if (matUpper.includes('ILLUSION')) return 'Illusion';

  // Se uma pedreira específica foi informada, verificar primeiro seus materiais
  if (pedreiraId && MATERIAIS_POR_PEDREIRA[pedreiraId]) {
    const matsPedreira = MATERIAIS_POR_PEDREIRA[pedreiraId];
    for (const m of matsPedreira) {
      const mUpper = m.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (matUpper.includes(mUpper) || mUpper.includes(matUpper)) {
        return m;
      }
    }
  }

  // Comparar contra todos os materiais oficiais cadastrados
  for (const item of TODOS_MATERIAIS_OFICIAIS) {
    const itemUpper = item.nome.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (matUpper.includes(itemUpper) || itemUpper.includes(matUpper)) {
      return item.nome;
    }
  }

  // Se não encontrar correspondência exata, remover prefixos geológicos e cores comuns
  const limpoSemPrefixos = matLimpo
    .replace(/^(QUARTZITO|GRANITO|BASALTO|MARMORE|MÁRMORE|PEGMATITO)\s+(BEGE|BRANCO|PRETO|VERDE|CINZA|AMARELO|MARROM|AZUL)?\s*/i, '')
    .trim();

  if (limpoSemPrefixos && limpoSemPrefixos.length >= 3) {
    const limpoUpper = limpoSemPrefixos.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (const item of TODOS_MATERIAIS_OFICIAIS) {
      const itemUpper = item.nome.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (limpoUpper.includes(itemUpper) || itemUpper.includes(limpoUpper)) {
        return item.nome;
      }
    }
  }

  return matLimpo;
};

/**
 * Identifica a pedreira Vermont a partir do material e das informações do documento.
 * O material tem prioridade sobre o endereço fiscal do cabeçalho da empresa.
 */
export const identificarPedreiraDoDocumento = (textoCompleto = '', materialDetectado = '') => {
  const matUpper = String(materialDetectado || '').toUpperCase();
  const t = (textoCompleto || '').toUpperCase();

  // 1. Se o material foi identificado, buscar sua pedreira oficial diretamente
  if (materialDetectado) {
    const pedPorMat = obterPedreiraPorMaterial(materialDetectado);
    if (pedPorMat) return pedPorMat;
  }

  // 2. Buscar por menções a materiais específicos no documento (ordem de especificidade)
  if (matUpper.includes('ZITAN') || t.includes('ZITAN') || matUpper.includes('SCENARIO') || t.includes('SCENARIO') || matUpper.includes('BRECCIA IMPERIALE') || t.includes('BRECCIA IMPERIALE') || t.includes('JAIBARAS') || (t.includes('SOBRAL') && !t.includes('MASSAPE'))) {
    const p = PEDREIRAS_CEARA.find(item => item.id === 'sobral_jaibaras');
    return {
      id: 'sobral_jaibaras',
      nome: p ? p.nome : 'Sobral - CE (Jaibaras)'
    };
  }

  if (matUpper.includes('BLUE DEEP') || t.includes('BLUE DEEP') || matUpper.includes('ROMA IMPERIALE') || t.includes('ROMA IMPERIALE') || matUpper.includes('PANETTONE') || t.includes('PANETTONE') || matUpper.includes('TELLUS BLUE') || t.includes('TELLUS BLUE') || matUpper.includes('ATLANTIC BLUE') || t.includes('ATLANTIC BLUE') || matUpper.includes('BLUE MARE') || t.includes('BLUE MARE') || matUpper.includes('BLUE ROMA') || t.includes('BLUE ROMA') || matUpper.includes('ILLUSION') || t.includes('ILLUSION') || t.includes('SERROTE') || t.includes('SÃO GONÇALO') || t.includes('SAO GONCALO')) {
    const p = PEDREIRAS_CEARA.find(item => item.id === 'serrote');
    return {
      id: 'serrote',
      nome: p ? p.nome : 'São Gonçalo do Amarante - CE (Serrote)'
    };
  }

  if (matUpper.includes('DEL MARE') || t.includes('DEL MARE') || matUpper.includes('CHATEAU') || t.includes('CHATEAU') || matUpper.includes('BRECCIA VIOLA') || t.includes('BRECCIA VIOLA') || matUpper.includes('EVORA') || t.includes('EVORA')) {
    const p = PEDREIRAS_CEARA.find(item => item.id === 'massape_delmare');
    return {
      id: 'massape_delmare',
      nome: p ? p.nome : 'Massapê - CE (Del Mare)'
    };
  }

  if (matUpper.includes('NEGRESCO') || t.includes('NEGRESCO') || matUpper.includes('INFINITY BROWN') || t.includes('INFINITY BROWN') || matUpper.includes('INFINITY BLACK') || t.includes('INFINITY BLACK') || matUpper.includes('JJ BROWN') || t.includes('JJ BROWN') || matUpper.includes('BROWN STRINGS') || t.includes('BROWN STRINGS') || matUpper.includes('BROWNIE') || t.includes('BROWNIE') || matUpper.includes('KOUROS') || t.includes('KOUROS') || matUpper.includes('TELLUS') || t.includes('TELLUS') || t.includes('BOA VISTA') || t.includes('MASSAPE') || t.includes('MASSAPÊ')) {
    const p = PEDREIRAS_CEARA.find(item => item.id === 'massape_negresco');
    return {
      id: 'massape_negresco',
      nome: p ? p.nome : 'Massapê - CE (Negresco)'
    };
  }

  if (matUpper.includes('NAURIKA') || t.includes('NAURIKA') || matUpper.includes('RAFFINATO') || t.includes('RAFFINATO') || matUpper.includes('GUINESS') || t.includes('GUINESS') || matUpper.includes('NOUVEAU') || t.includes('NOUVEAU') || t.includes('BEBERIBE')) {
    const p = PEDREIRAS_CEARA.find(item => item.id === 'beberibe');
    return {
      id: 'beberibe',
      nome: p ? p.nome : 'Beberibe - CE'
    };
  }

  if (matUpper.includes('SANTA QUITERIA') || matUpper.includes('SANTA QUITÉRIA') || t.includes('SANTA QUITERIA') || t.includes('SANTA QUITÉRIA')) {
    const p = PEDREIRAS_CEARA.find(item => item.id === 'santa_quiteria');
    return {
      id: 'santa_quiteria',
      nome: p ? p.nome : 'Santa Quitéria - CE'
    };
  }

  if (matUpper.includes('CRISTALLO') || t.includes('CRISTALLO') || matUpper.includes('URUAÇU') || matUpper.includes('URUACU') || t.includes('URUAÇU') || t.includes('URUACU') || t.includes('GOIAS') || t.includes('GOIÁS')) {
    const p = PEDREIRAS_CEARA.find(item => item.id === 'uruacu');
    return {
      id: 'uruacu',
      nome: p ? p.nome : 'Uruaçu - GO'
    };
  }

  if (matUpper.includes('TAJ MAHAL') || t.includes('TAJ MAHAL') || matUpper.includes('TAJMAHAL') || t.includes('TAJMAHAL')) {
    const p = PEDREIRAS_CEARA.find(item => item.id === 'uruoca');
    return {
      id: 'uruoca',
      nome: p ? p.nome : 'Uruoca - CE (Taj Mahal)'
    };
  }

  // 3. Fallback padrão: Uruoca
  const padrao = PEDREIRAS_CEARA[0];
  return {
    id: padrao ? padrao.id : 'uruoca',
    nome: padrao ? padrao.nome : 'Uruoca - CE (Taj Mahal)'
  };
};

/**
 * Gera conjunto de chaves de comparação para correspondência inteligente de blocos
 * (ex: "36/26" -> ["36/26", "3626", "36"])
 * (ex: "126" -> ["0126", "01/26", "126", "1/26", "01", "1"])
 * (ex: "1/26" -> ["01/26", "0126", "1/26", "126", "01", "1"])
 * (ex: "0126" -> ["0126", "01/26", "126", "1/26", "01", "1"])
 * (ex: "747/26" -> ["747/26", "74726", "747"])
 * (ex: "74726" -> ["74726", "747/26", "747"])
 * (ex: "1826" -> ["1826", "18/26", "18"])
 */
export const extrairChavesComparacaoBloco = (numeroBloco) => {
  if (!numeroBloco) return [];
  const limpo = String(numeroBloco).trim().toUpperCase().replace(/[.\s-]+$/, '').replace(/^[.\s-]+/, '');
  const apenasAlfaNum = limpo.replace(/[^0-9A-Z]/g, '');
  const chaves = new Set([limpo, apenasAlfaNum]);

  // Se tem hífen (ex: 190/26-A -> 190/26A)
  if (limpo.includes('-')) {
    chaves.add(limpo.replace(/-/g, ''));
    chaves.add(limpo.replace(/-/g, '/'));
  }

  // Se tem barra (ex: 36/26, 1/26, 01/26, 747/26, 190/26A, 190/26-A)
  if (limpo.includes('/')) {
    const partes = limpo.split('/');
    const seq = partes[0]?.trim();
    const resto = partes[1]?.trim(); // ex: "26", "26A", "26-A", "26 A"

    if (seq) {
      chaves.add(seq);
      if (/^\d$/.test(seq)) {
        chaves.add(`0${seq}`); // "01"
      }
    }

    if (seq && resto) {
      const matchAnoLetra = resto.match(/^(\d{2,4})[-\s]?([A-Z])?$/);
      if (matchAnoLetra) {
        const ano = matchAnoLetra[1];
        const letra = matchAnoLetra[2] || '';
        
        chaves.add(`${seq}${ano}${letra}`); // "19026A"
        chaves.add(`${seq}/${ano}${letra}`); // "190/26A"
        if (letra) {
          chaves.add(`${seq}/${ano}-${letra}`); // "190/26-A"
          chaves.add(`${seq}/${ano} ${letra}`); // "190/26 A"
          chaves.add(`${seq}${letra}`); // "190A"
          chaves.add(`${seq}-${letra}`); // "190-A"
        }

        if (/^\d$/.test(seq)) {
          chaves.add(`0${seq}/${ano}${letra}`); // "01/26A"
          chaves.add(`0${seq}${ano}${letra}`); // "0126A"
        }
        if (seq.startsWith('0') && seq.length === 2) {
          chaves.add(`${seq.slice(1)}/${ano}${letra}`); // "1/26A"
          chaves.add(`${seq.slice(1)}${ano}${letra}`); // "126A"
        }
      } else {
        chaves.add(`${seq}${resto}`);
      }
    }
  }

  // Se for 3 dígitos numéricos (ex: 126 -> sequência 1, ano 26 -> 0126 / 01/26)
  if (/^\d{3}$/.test(apenasAlfaNum)) {
    const seq = apenasAlfaNum.slice(0, 1);
    const ano = apenasAlfaNum.slice(1);
    const anoNum = parseInt(ano, 10);
    if (anoNum >= 20 && anoNum <= 35) {
      chaves.add(`0${seq}${ano}`); // "0126"
      chaves.add(`0${seq}/${ano}`); // "01/26"
      chaves.add(`${seq}/${ano}`); // "1/26"
      chaves.add(seq); // "1"
      chaves.add(`0${seq}`); // "01"
    }
  }

  // Se for 4 caracteres com sufixo de letra (ex: 126A -> 01/26A, 1/26A, 0126A)
  const match3NumLetra = apenasAlfaNum.match(/^(\d)(\d{2})([A-Z])$/);
  if (match3NumLetra) {
    const [, seq, ano, letra] = match3NumLetra;
    chaves.add(`0${seq}${ano}${letra}`);
    chaves.add(`0${seq}/${ano}${letra}`);
    chaves.add(`${seq}/${ano}${letra}`);
    chaves.add(`${seq}${letra}`);
  }

  // Se for 4 dígitos numéricos (ex: 0126, 3626, 1826)
  if (/^\d{4}$/.test(apenasAlfaNum)) {
    const seq = apenasAlfaNum.slice(0, 2);
    const ano = apenasAlfaNum.slice(2);
    const anoNum = parseInt(ano, 10);
    if (anoNum >= 20 && anoNum <= 35) {
      chaves.add(`${seq}/${ano}`); // "36/26", "01/26"
      chaves.add(seq); // "36", "01"
      if (seq.startsWith('0')) {
        chaves.add(seq.slice(1)); // "1"
        chaves.add(`${seq.slice(1)}/${ano}`); // "1/26"
        chaves.add(`${seq.slice(1)}${ano}`); // "126"
      }
    }
  }

  // Se for 5 caracteres com ano e letra (ex: 3626A, 0126A)
  const match4NumLetra = apenasAlfaNum.match(/^(\d{2})(\d{2})([A-Z])$/);
  if (match4NumLetra) {
    const [, seq, ano, letra] = match4NumLetra;
    chaves.add(`${seq}/${ano}${letra}`);
    chaves.add(`${seq}/${ano}-${letra}`);
    chaves.add(`${seq}${letra}`);
  }

  // Se é número com sufixo alfabético de 1 a 5 caracteres (ex: 2438TM, 0426TBL, 0326IBW, 3526A, 132/26B)
  const matchNumSufixo = apenasAlfaNum.match(/^(\d+)([A-Z]{1,5})$/);
  if (matchNumSufixo) {
    const [, num, sufixo] = matchNumSufixo;
    chaves.add(num);
    chaves.add(`${num} ${sufixo}`);
    chaves.add(`${num}-${sufixo}`);
    chaves.add(`${num}${sufixo}`);
  }

  // Se é número de 5 dígitos sem barra com final de ano (ex: 74726 -> 747/26)
  if (/^\d{5}$/.test(apenasAlfaNum) && (apenasAlfaNum.endsWith('24') || apenasAlfaNum.endsWith('25') || apenasAlfaNum.endsWith('26') || apenasAlfaNum.endsWith('27') || apenasAlfaNum.endsWith('28'))) {
    const base = apenasAlfaNum.slice(0, 3);
    const ano = apenasAlfaNum.slice(3);
    chaves.add(`${base}/${ano}`);
    chaves.add(base);
  }

  // Se for 6 caracteres com base 3 + ano 2 + letra (ex: 19026A -> 190/26A)
  const match5NumLetra = apenasAlfaNum.match(/^(\d{3})(\d{2})([A-Z])$/);
  if (match5NumLetra) {
    const [, base, ano, letra] = match5NumLetra;
    chaves.add(`${base}/${ano}${letra}`);
    chaves.add(`${base}/${ano}-${letra}`);
    chaves.add(`${base}/${ano} ${letra}`);
    chaves.add(`${base}${letra}`);
    chaves.add(`${base}-${letra}`);
  }

  // Se for 6 dígitos (ex: 125626 -> 1256/26)
  if (/^\d{6}$/.test(apenasAlfaNum) && (apenasAlfaNum.endsWith('24') || apenasAlfaNum.endsWith('25') || apenasAlfaNum.endsWith('26') || apenasAlfaNum.endsWith('27') || apenasAlfaNum.endsWith('28'))) {
    const base = apenasAlfaNum.slice(0, 4);
    const ano = apenasAlfaNum.slice(4);
    chaves.add(`${base}/${ano}`);
    chaves.add(base);
  }

  return Array.from(chaves).filter(Boolean);
};

/**
 * Analisa a seção OBSERVAÇÕES do romaneio e mapeia valores de envelopamento por bloco
 * com suporte a múltiplas páginas e variações de notação (ex: 190/26A, 190/26B, 36/26, 126, 74726 vs 747/26).
 */
export const extrairObservacoesEEnvelopamento = (textoCompleto) => {
  const resultado = {
    textoObservacoes: '',
    semEnvelopamentoGeral: false,
    envelopamentoPorBloco: new Map() // chaveNormalizada -> { blocoOriginal, valor, detalhe }
  };

  // Pode haver mais de uma seção OBSERVAÇÕES em PDFs com múltiplas páginas
  const regexObsGeral = /OBSERVA[ÇC][ÕO]ES([\s\S]*?)(?:Confirma[çc][ãa]o do Or[çc]amento|Assinatura:|Nome Leg[íi]vel:|--- NOVA PAGINA ---|$)/gi;
  let matchSecao;
  let textosAcumulados = [];

  while ((matchSecao = regexObsGeral.exec(textoCompleto)) !== null) {
    if (matchSecao[1]) {
      textosAcumulados.push(matchSecao[1].trim());
    }
  }

  const textoObsFinal = textosAcumulados.join('\n\n');
  resultado.textoObservacoes = textoObsFinal;

  // Verificar declaração explícita "Sem envelopamento"
  if (/sem\s+envelopamento/i.test(textoObsFinal)) {
    resultado.semEnvelopamentoGeral = true;
  }

  // Processar linha por linha da seção observações
  const linhasObs = textoObsFinal.split('\n').map(l => l.trim()).filter(Boolean);
  let dentroSecaoEnvelopamento = false;

  for (const linha of linhasObs) {
    // Verificar se é cabeçalho de seção de envelopamento (ex: "Envelopamento 02 mantas:", "Envelopamento:")
    if (/^envelopamento/i.test(linha)) {
      dentroSecaoEnvelopamento = true;
    }

    // Padrão 1: Linha contendo bloco (com ou sem sufixo de letra/código) e valor em R$
    // Ex: "190/26A- R$ 2.396,80", "2438TM - R$ 3.232,00", "2438 TM - R$ 3.232,00", "36/26 - R$ 3.507,84", "74726 - R$ 2.042,88"
    const matchBlocoValor = linha.match(/(?:(?:BLOCO|BL\.?|N[º°]?)\s*)?([0-9]{1,6}(?:\/[0-9]{2,4})?(?:[-\s]*[A-Za-z0-9]{1,6})?|[0-9]{2,7}(?:[-\s]*[A-Za-z0-9]{1,6})?|VT-[0-9A-Za-z]+)\s*[-:]?\s*(?:\([^\)]*\)\s*)?R?\$?\s*([\d.]+,\d{2})/i);

    if (matchBlocoValor) {
      const blocoBruto = matchBlocoValor[1].trim().toUpperCase().replace(/[.\s-]+$/, '').replace(/^[.\s-]+/, '');
      const valorStr = matchBlocoValor[2].trim();
      const valorFloat = converterValorMonetarioParaFloat(valorStr);

      // Não confundir cabeçalhos tipo "02" de "02 mantas" com número de bloco
      const ehCabecalhoMantas = /mantas?/i.test(blocoBruto) || /mantas?/i.test(linha.replace(valorStr, ''));

      if (valorFloat > 0 && !ehCabecalhoMantas) {
        const chaves = extrairChavesComparacaoBloco(blocoBruto);
        const info = {
          blocoOriginal: blocoBruto,
          valor: valorFloat,
          valorFormatado: valorStr,
          detalhe: `Envelopamento nas Observações (R$ ${valorStr})`
        };

        chaves.forEach(k => {
          resultado.envelopamentoPorBloco.set(k, info);
        });
        continue;
      }
    }

    // Padrão 2: Se estamos dentro de uma seção de Envelopamento e a linha lista blocos
    // Ex: "190/26A, 190/26B" ou "Blocos: 190/26A" ou "2438TM, 2439TM"
    if (dentroSecaoEnvelopamento && !/^(prazo|vencimento|obs|nota|frete|total|desconto)/i.test(linha)) {
      const possiveisBlocos = linha.matchAll(/\b([0-9]{1,6}\/[0-9]{2,4}[-\s]?[A-Za-z0-9]{1,5}|[0-9]{2,7}[-\s]?[A-Za-z0-9]{1,5}|VT-[0-9A-Za-z]+)\b/g);
      for (const m of possiveisBlocos) {
        const blocoIdentificado = m[1].trim().toUpperCase().replace(/[.\s-]+$/, '').replace(/^[.\s-]+/, '');
        // Ignorar coisas como "02" de "02 mantas" ou datas completas como "23/03/2026"
        if (/^\d{2}$/.test(blocoIdentificado) || /^\d{2}\/\d{2}\/\d{4}$/.test(blocoIdentificado)) continue;

        const chaves = extrairChavesComparacaoBloco(blocoIdentificado);
        const info = {
          blocoOriginal: blocoIdentificado,
          valor: 0,
          valorFormatado: 'Identificado nas observações',
          detalhe: `Identificado na seção de Envelopamento (${linha})`
        };
        chaves.forEach(k => {
          if (!resultado.envelopamentoPorBloco.has(k)) {
            resultado.envelopamentoPorBloco.set(k, info);
          }
        });
      }
    }
  }

  return resultado;
};

/**
 * Extrai o peso em Kg do bloco a partir do restante da linha da tabela de romaneio
 * (Exemplos na tabela Vermont: MED.BRT, MED.LIQ, MTS BR, PESO (Kg), MTS LIQ...)
 */
export const extrairPesoKgLinha = (restanteLinha) => {
  if (!restanteLinha) return '';
  
  // Padrão 1: Após dimensões e MTS BR (ex: "3,420 x 2,030 x 1,880 3,300 x 1,850 x 1,650 13,052 34.849,11 10,073 ...")
  const matchDims = restanteLinha.match(/\d+[,.]\d+\s*x\s*\d+[,.]\d+\s*x\s*\d+[,.]\d+\s+(\d+[,.]\d+)\s+([\d.]+,\d{2}|\d+)/i);
  if (matchDims && matchDims[2]) {
    return matchDims[2].trim();
  }

  // Padrão 2: Se vier com uma dimensão apenas e MTS BR + PESO
  const matchUmaDim = restanteLinha.match(/\d+[,.]\d+\s*x\s*\d+[,.]\d+\s*x\s*\d+[,.]\d+\s+([\d.]+,\d{2})/i);
  if (matchUmaDim && matchUmaDim[1]) {
    return matchUmaDim[1].trim();
  }

  // Padrão 3: Procurar número com formato de milhares brasileiro (ex: 34.849,11 ou 21.274,56 ou 38.295,68)
  const matchMilhares = restanteLinha.match(/\b(\d{1,3}(?:\.\d{3})+,\d{2})\b/);
  if (matchMilhares && matchMilhares[1]) {
    return matchMilhares[1].trim();
  }

  return '';
};

/**
 * Parser principal de Romaneios em PDF da Vermont Mineração.
 * Recebe o texto extraído do PDF e aplica todas as regras de negócio para reconhecimento
 * de cabeçalho, blocos, peso (kg) e status de envelopamento em documentos de uma ou múltiplas páginas.
 */
export const processarRomaneioPdfTexto = async (textoCompleto) => {
  if (!textoCompleto || typeof textoCompleto !== 'string') {
    throw new Error('Conteúdo do documento não pôde ser lido.');
  }

  // 1. Identificar Número do Romaneio
  let numeroRomaneio = '';
  const matchRomaneio = textoCompleto.match(/ROMANEIO\s+N[º°o]?\s*([0-9A-Za-z/]+)/i);
  if (matchRomaneio) {
    numeroRomaneio = matchRomaneio[1].trim();
  }

  // 2. Identificar Data de Emissão e Saída
  let dataEmissao = '';
  let dataSaida = '';
  const matchEmissao = textoCompleto.match(/Emiss[ãa]o:\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (matchEmissao) dataEmissao = matchEmissao[1];
  const matchSaida = textoCompleto.match(/Sa[íi]da:\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (matchSaida) dataSaida = matchSaida[1];

  // 3. Identificar Pedreira / Unidade
  const pedreiraDetectada = identificarPedreiraDoDocumento(textoCompleto);

  // 4. Identificar Cliente Comprador
  let clienteNome = '';
  const matchCliente = textoCompleto.match(/Cliente:\s*(?:[0-9]+\s*-\s*)?([^\n\r]+)/i);
  if (matchCliente) {
    clienteNome = matchCliente[1]
      .replace(/\s*Endereço:.*$/i, '')
      .replace(/\s*ROD\s+ES.*$/i, '')
      .trim();
    clienteNome = limparNomeEmpresa(clienteNome).toUpperCase();
  }

  // 5. Identificar CNPJ do Cliente
  let clienteCnpj = '';
  const matchCnpj = textoCompleto.match(/CNPJ\/CPF:\s*(\d{11,14}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/i);
  if (matchCnpj) {
    clienteCnpj = formatarCNPJ(matchCnpj[1]);
  }

  let clienteNomeOriginalPdf = clienteNome;
  let fonteCliente = 'Romaneio PDF';

  // Consulta em tempo real na API gratuita da Receita Federal pelo CNPJ
  const cnpjLimpo = (clienteCnpj || '').replace(/\D/g, '');
  if (cnpjLimpo.length === 14) {
    try {
      const consultaReceita = await consultarCNPJReceita(cnpjLimpo);
      if (consultaReceita?.valido && consultaReceita?.empresa?.razao_social) {
        clienteNome = consultaReceita.empresa.razao_social.toUpperCase().trim();
        fonteCliente = consultaReceita.fonte || 'Receita Federal (Oficial)';
      }
    } catch (eCnpj) {
      console.warn('[PDF Romaneio] Consulta de CNPJ na Receita:', eCnpj);
    }
  }

  // 6. Extrair Seção de Observações e Mapeamento de Valores de Envelopamento
  const infoObservacoes = extrairObservacoesEEnvelopamento(textoCompleto);

  // 7. Extrair Itens / Blocos da Tabela através de todas as páginas
  const linhas = textoCompleto.split('\n').map(l => l.trim()).filter(Boolean);
  const blocosDetectados = [];
  const blocosJaAdicionados = new Set();

  for (let i = 0; i < linhas.length; i++) {
    let linha = linhas[i];

    // Ignorar linhas de cabeçalho, rodapé ou quebras de página
    if (
      linha.startsWith('--- NOVA PAGINA') ||
      linha.startsWith('ROMANEIO Nº') ||
      linha.startsWith('VERMONT MINERACAO') ||
      linha.startsWith('FAZ ') ||
      linha.startsWith('Cliente:') ||
      linha.startsWith('Endereço:') ||
      linha.startsWith('Cidade:') ||
      linha.startsWith('CNPJ/CPF:') ||
      linha.startsWith('Fone/Fax:') ||
      linha.startsWith('BLOCO MATERIAL') ||
      linha.startsWith('Qtd:') ||
      linha.startsWith('M2 /') ||
      linha.startsWith('Cotação') ||
      linha.startsWith('Dólar') ||
      linha.startsWith('OBSERVAÇÕES') ||
      linha.startsWith('Prazo:') ||
      linha.startsWith('Envelopamento ') ||
      linha.startsWith('TOTAL ') ||
      linha.startsWith('Desconto ') ||
      linha.startsWith('Confirmação') ||
      linha.startsWith('Nome Legível')
    ) {
      continue;
    }

    // Se a linha atual contém apenas o bloco ou bloco + material e a próxima linha tem as dimensões, junta as duas
    if (i + 1 < linhas.length && !/\d+(?:[,.]\d+)?\s*[xX*]\s*\d+/.test(linha) && /\d+(?:[,.]\d+)?\s*[xX*]\s*\d+/.test(linhas[i + 1])) {
      linha = `${linha} ${linhas[i + 1]}`;
    }

    // Padrão de linha de bloco Vermont:
    // Identifica linhas que possuem a estrutura de tabela de blocos com dimensões (ex: 3,100 x 1,950 x 2,000)
    const matchDimensoes = linha.match(/^(.+?)\s+(\d+(?:[,.]\d+)?\s*[xX*]\s*\d+(?:[,.]\d+)?\s*[xX*]\s*.*)$/i);
    
    if (matchDimensoes) {
      let parteAnterior = matchDimensoes[1].trim();
      // Só remove numeração de item (ex: "1. 126" ou "1 - 126" ou "1) 126") se houver outro número de bloco em seguida
      parteAnterior = parteAnterior.replace(/^(?:Item\s+)?\d{1,2}[.)-]\s+(?=\d|VT-)/i, '');
      const restanteLinha = matchDimensoes[2].trim();

      // Expressão para localizar onde se inicia o nome do material ou tipo de rocha
      const regexInicioMaterial = /\b(QUARTZITO|GRANITO|BASALTO|MARMORE|MÁRMORE|PEGMATITO|DOLOMITO|CALCITO|ROCHA|TAJ\s*MAHAL|NEGRESCO|DEL\s*MARE|NAURIKA|ZITAN|CRISTALLO|RAFFINATO|GUINESS|NOUVEAU|SCENARIO|CHATEAU\s*BLANC|BRECCIA\s*VIOLA|BRECCIA\s*IMPERIALE|BRECCIA|INFINITY\s*BROWN|INFINITY\s*BLACK|INFINITY|ROMA\s*IMPERIALE|BLUE\s*DEEP|BLUE\s*MARE|BLUE\s*ROMA|TELLUS\s*BLUE|ATLANTIC\s*BLUE|BROWN\s*STRINGS|JJ\s*BROWN|PANETTONE|EVORA|KOUROS|BROWNIE|TELLUS|ILLUSION|VERDE\s*ESPIRAL|PERLA\s*VENATA|SERROTE|JAIBARAS|BEBERIBE)\b/i;

      let numeroBlocoBruto = '';
      let materialBruto = '';

      const matchMat = parteAnterior.match(regexInicioMaterial);
      if (matchMat && matchMat.index !== undefined && matchMat.index > 0) {
        numeroBlocoBruto = parteAnterior.slice(0, matchMat.index).trim();
        materialBruto = parteAnterior.slice(matchMat.index).trim();
      } else {
        // Fallback: se não achar pelo nome do material, separa pelo primeiro padrão de bloco
        const matchFallback = parteAnterior.match(/^([0-9]{1,6}(?:\/[0-9]{2,4})?(?:[\s-]+[A-Za-z0-9]{1,6})?|[0-9]{2,7}(?:[\s-]+[A-Za-z0-9]{1,6})?|VT-[0-9A-Za-z]+)\s+(.*)$/i);
        if (matchFallback) {
          numeroBlocoBruto = matchFallback[1].trim();
          materialBruto = matchFallback[2].trim();
        } else {
          const parts = parteAnterior.split(/\s+/);
          numeroBlocoBruto = parts[0] || '';
          materialBruto = parts.slice(1).join(' ') || '';
        }
      }

      // Validação: prosseguir apenas se houver identificador numérico de bloco
      if (!numeroBlocoBruto || !/\d/.test(numeroBlocoBruto)) {
        continue;
      }

      const isExcecaoBarra = isClienteComBarraNoBloco(clienteNome);
      const numeroBloco = sanitizarNumeroBloco(numeroBlocoBruto, isExcecaoBarra);
      
      // Evitar blocos duplicados acidentais no mesmo arquivo
      if (blocosJaAdicionados.has(numeroBloco)) {
        continue;
      }
      blocosJaAdicionados.add(numeroBloco);

      // Normalizar o material comparando com a base oficial de materiais das pedreiras
      const materialNormalizado = normalizarMaterialVermont(materialBruto);
      const pedreiraBloco = obterPedreiraPorMaterial(materialNormalizado) || pedreiraDetectada;

      // Extrair o Peso em Kg da coluna PESO (Kg)
      const pesoKgExtraido = extrairPesoKgLinha(restanteLinha);

      // Extrair valores monetários no final da linha para identificar a coluna ENVELOPAMENTO
      // Na ordem da tabela: [DESCONTO, FRETE, ENVELOPAMENTO, TOTAL GERAL R$]
      const valoresMonetarios = restanteLinha.match(/[\d.]+,\d{2}/g) || [];
      
      let valorColunaEnvelopamento = 0;
      let valorColunaStr = '0,00';

      if (valoresMonetarios.length >= 4) {
        // O penúltimo valor antes do Total Geral é a coluna ENVELOPAMENTO
        valorColunaStr = valoresMonetarios[valoresMonetarios.length - 2];
        valorColunaEnvelopamento = converterValorMonetarioParaFloat(valorColunaStr);
      }

      // APLICAR AS 3 REGRAS DE CLASSIFICAÇÃO DE STATUS
      let statusCalculado = 'sem_envelopamento';
      let motivoStatus = '';
      let valorCobrado = 0;

      // REGRA 1: Se a coluna ENVELOPAMENTO tiver valor > 0
      if (valorColunaEnvelopamento > 0) {
        statusCalculado = 'pendente_envelopamento';
        motivoStatus = `Regra 1: Valor na coluna Envelopamento (R$ ${valorColunaStr})`;
        valorCobrado = valorColunaEnvelopamento;
      } 
      // REGRA 2: Se a coluna for 0,00 mas o bloco constar nas OBSERVAÇÕES com valor em R$
      else {
        // Testar todas as chaves possíveis de correspondência (ex: "747/26", "74726", "747")
        const chavesBloco = extrairChavesComparacaoBloco(numeroBloco);
        let infoObsBloco = null;
        for (const chave of chavesBloco) {
          if (infoObservacoes.envelopamentoPorBloco.has(chave)) {
            infoObsBloco = infoObservacoes.envelopamentoPorBloco.get(chave);
            break;
          }
        }

        if (infoObsBloco) {
          statusCalculado = 'pendente_envelopamento';
          motivoStatus = `Regra 2: ${infoObsBloco.detalhe}`;
          valorCobrado = infoObsBloco.valor;
        } 
        // REGRA 3: Não consta na coluna nem nas observações (ou observações dizem "Sem envelopamento")
        else {
          statusCalculado = 'sem_envelopamento';
          motivoStatus = infoObservacoes.semEnvelopamentoGeral
            ? 'Regra 3: Declarado "Sem envelopamento" nas observações'
            : 'Regra 3: Sem cobrança de envelopamento para este bloco';
        }
      }

      blocosDetectados.push({
        id: `pdf_item_${Date.now()}_${blocosDetectados.length}_${Math.random().toString(36).substr(2, 4)}`,
        numero_bloco: numeroBloco,
        material: materialNormalizado,
        material_original: materialBruto,
        peso_kg: pesoKgExtraido,
        numero_romaneio: numeroRomaneio || '',
        data_romaneio: dataEmissao || '',
        pedreira_id: pedreiraBloco.id,
        pedreira_nome: pedreiraBloco.nome,
        cliente_nome: clienteNome,
        cliente_cnpj: clienteCnpj,
        status: statusCalculado,
        motivoStatus,
        valorCobrado,
        selecionado: true, // Marcado para importação por padrão
        observacoes: `Romaneio Nº ${numeroRomaneio || 'S/N'} (${dataEmissao || ''}) - ${motivoStatus}`
      });
    }
  }

  const pedreiraFinal = (blocosDetectados.length > 0 && blocosDetectados[0].pedreira_id)
    ? { id: blocosDetectados[0].pedreira_id, nome: blocosDetectados[0].pedreira_nome }
    : pedreiraDetectada;

  return {
    sucesso: true,
    numeroRomaneio,
    dataEmissao,
    dataSaida,
    pedreira: pedreiraFinal,
    cliente: {
      nome: clienteNome,
      nome_original_pdf: clienteNomeOriginalPdf,
      cnpj: clienteCnpj,
      fonte: fonteCliente
    },
    observacoes: infoObservacoes.textoObservacoes,
    totalBlocos: blocosDetectados.length,
    blocos: blocosDetectados
  };
};

/**
 * Lê diretamente um arquivo PDF de romaneio e retorna os blocos processados
 */
export const lerEProcessarRomaneioPdf = async (arquivoOuBuffer) => {
  const texto = await extrairTextoDoPdf(arquivoOuBuffer);
  return await processarRomaneioPdfTexto(texto);
};
