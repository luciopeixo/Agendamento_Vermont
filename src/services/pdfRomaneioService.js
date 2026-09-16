import * as pdfjsLib from 'pdfjs-dist';
import { formatarCNPJ, limparNomeEmpresa, PEDREIRAS_CEARA } from './agendamentoService.js';

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
    
    // Agrupar itens de texto por coordenada Y aproximada (linhas)
    const linhasMap = new Map();
    const TOLERANCIA_Y = 3.5; // pixels de tolerância para considerar na mesma linha

    for (const item of textContent.items) {
      if (!item.str || item.str.trim() === '') continue;
      
      const y = Math.round(item.transform[5]);
      const x = item.transform[4];
      
      // Encontrar chave de Y próxima
      let chaveYEncontrada = null;
      for (const key of linhasMap.keys()) {
        if (Math.abs(key - y) <= TOLERANCIA_Y) {
          chaveYEncontrada = key;
          break;
        }
      }

      const chaveY = chaveYEncontrada !== null ? chaveYEncontrada : y;
      if (!linhasMap.has(chaveY)) {
        linhasMap.set(chaveY, []);
      }
      linhasMap.get(chaveY).push({ x, text: item.str });
    }

    // Ordenar linhas do topo para o rodapé (Y decrescente no PDF)
    const chavesOrdenadas = Array.from(linhasMap.keys()).sort((a, b) => b - a);
    
    const linhasTexto = chavesOrdenadas.map(y => {
      // Ordenar itens da linha da esquerda para a direita (X crescente)
      const itensLinha = linhasMap.get(y).sort((a, b) => a.x - b.x);
      return itensLinha.map(it => it.text.trim()).join(' ');
    });

    paginasTexto.push(linhasTexto.join('\n'));
  }

  return paginasTexto.join('\n\n--- NOVA PAGINA ---\n\n');
};

/**
 * Normaliza o nome do material para o padrão das pedreiras Vermont
 */
export const normalizarMaterialVermont = (materialBruto) => {
  if (!materialBruto) return 'Taj Mahal';
  const matUpper = String(materialBruto).toUpperCase();
  
  if (matUpper.includes('TAJ MAHAL') || matUpper.includes('TAJMAHAL')) {
    return 'Taj Mahal';
  }
  if (matUpper.includes('BASALTO') || matUpper.includes('NEGRESCO')) {
    return 'Basalto / Donatello';
  }
  if (matUpper.includes('DONATELLO')) {
    return 'Donatello';
  }
  if (matUpper.includes('PERLA') || matUpper.includes('SANTANA')) {
    return 'Perla Santana';
  }
  if (matUpper.includes('MACAMBIRA')) {
    return 'Macambira';
  }
  return materialBruto.trim();
};

/**
 * Identifica a pedreira Vermont a partir das informações de cabeçalho do documento
 */
export const identificarPedreiraDoDocumento = (textoCompleto) => {
  const t = (textoCompleto || '').toUpperCase();
  
  if (t.includes('MACAMBIRA') || t.includes('SERRA DA GOIANA') || t.includes('URUOCA')) {
    const p = PEDREIRAS_CEARA.find(item => item.id === 'uruoca');
    return {
      id: 'uruoca',
      nome: p ? p.nome : 'Uruoca - CE (Taj Mahal)'
    };
  }

  if (t.includes('BOA VISTA') || t.includes('MASSAPE') || t.includes('MASSAPÊ')) {
    const p = PEDREIRAS_CEARA.find(item => item.id === 'massape');
    return {
      id: 'massape',
      nome: p ? p.nome : 'Massapê - CE (Basalto / Donatello)'
    };
  }

  if (t.includes('SOBRAL')) {
    const p = PEDREIRAS_CEARA.find(item => item.id === 'sobral');
    return {
      id: 'sobral',
      nome: p ? p.nome : 'Sobral - CE'
    };
  }

  if (t.includes('SANTA QUITERIA') || t.includes('SANTA QUITÉRIA')) {
    const p = PEDREIRAS_CEARA.find(item => item.id === 'santa_quiteria');
    return {
      id: 'santa_quiteria',
      nome: p ? p.nome : 'Santa Quitéria - CE'
    };
  }

  // Fallback padrão
  const padrao = PEDREIRAS_CEARA[0];
  return {
    id: padrao ? padrao.id : 'uruoca',
    nome: padrao ? padrao.nome : 'Uruoca - CE (Taj Mahal)'
  };
};

/**
 * Gera conjunto de chaves de comparação para correspondência inteligente de blocos
 * (ex: "747/26" -> ["747/26", "74726", "747"])
 * (ex: "74726" -> ["74726", "747/26", "747"])
 * (ex: "1826" -> ["1826"])
 */
export const extrairChavesComparacaoBloco = (numeroBloco) => {
  if (!numeroBloco) return [];
  const limpo = String(numeroBloco).trim().toUpperCase();
  const apenasAlfaNum = limpo.replace(/[^0-9A-Z]/g, '');
  const chaves = new Set([limpo, apenasAlfaNum]);

  // Se tem barra (ex: 747/26)
  if (limpo.includes('/')) {
    const partes = limpo.split('/');
    if (partes[0]) chaves.add(partes[0].trim()); // "747"
    if (partes[0] && partes[1]) chaves.add(`${partes[0].trim()}${partes[1].trim()}`); // "74726"
  }

  // Se é número de 5 dígitos sem barra com final de ano (ex: 74726 -> 747/26)
  if (/^\d{5}$/.test(apenasAlfaNum) && (apenasAlfaNum.endsWith('24') || apenasAlfaNum.endsWith('25') || apenasAlfaNum.endsWith('26') || apenasAlfaNum.endsWith('27'))) {
    const base = apenasAlfaNum.slice(0, 3);
    const ano = apenasAlfaNum.slice(3);
    chaves.add(`${base}/${ano}`);
    chaves.add(base);
  }

  // Se for 6 dígitos (ex: 125626 -> 1256/26)
  if (/^\d{6}$/.test(apenasAlfaNum) && (apenasAlfaNum.endsWith('24') || apenasAlfaNum.endsWith('25') || apenasAlfaNum.endsWith('26') || apenasAlfaNum.endsWith('27'))) {
    const base = apenasAlfaNum.slice(0, 4);
    const ano = apenasAlfaNum.slice(4);
    chaves.add(`${base}/${ano}`);
    chaves.add(base);
  }

  return Array.from(chaves).filter(Boolean);
};

/**
 * Analisa a seção OBSERVAÇÕES do romaneio e mapeia valores de envelopamento por bloco
 * com suporte a múltiplas páginas e variações de notação (ex: 74726 vs 747/26).
 */
export const extrairObservacoesEEnvelopamento = (textoCompleto) => {
  const resultado = {
    textoObservacoes: '',
    semEnvelopamentoGeral: false,
    envelopamentoPorBloco: new Map() // chaveNormalizada -> { numeroOriginal, valor, detalhe }
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

  // Buscar linhas de envelopamento por bloco:
  // Ex: "74726 - R$ 2.042,88" ou "1826- R$ 3.617,60" ou "747/26 - R$ 2.042,88" ou "1826: R$ 3.617,60"
  const regexLinhaBlocoValor = /(?:^|[\s\n\r])([0-9]{3,6}(?:\/[0-9]{2})?)\s*[-:]?\s*R?\$?\s*([\d.]+,\d{2})/gmi;
  let matchItem;

  while ((matchItem = regexLinhaBlocoValor.exec(textoObsFinal)) !== null) {
    const blocoBruto = matchItem[1].trim().toUpperCase();
    const valorStr = matchItem[2].trim();
    const valorFloat = converterValorMonetarioParaFloat(valorStr);

    if (valorFloat > 0) {
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
    }
  }

  return resultado;
};

/**
 * Parser principal de Romaneios em PDF da Vermont Mineração.
 * Recebe o texto extraído do PDF e aplica todas as regras de negócio para reconhecimento
 * de cabeçalho, blocos e status de envelopamento em documentos de uma ou múltiplas páginas.
 */
export const processarRomaneioPdfTexto = (textoCompleto) => {
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

  // 6. Extrair Seção de Observações e Mapeamento de Valores de Envelopamento
  const infoObservacoes = extrairObservacoesEEnvelopamento(textoCompleto);

  // 7. Extrair Itens / Blocos da Tabela através de todas as páginas
  const linhas = textoCompleto.split('\n').map(l => l.trim()).filter(Boolean);
  const blocosDetectados = [];
  const blocosJaAdicionados = new Set();

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];

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

    // Padrão de linha de bloco Vermont:
    // Começa com número do bloco (ex: 839/26 ou 747/26 ou 1826 ou 0326), seguido do nome do material e dimensões
    const matchLinhaBloco = linha.match(/^([0-9]{3,6}(?:\/[0-9]{2})?|[0-9A-Z/-]+)\s+([A-ZÀ-Ú\s]+?)\s+(\d+[,.]\d{2,3}\s*x\s*.*)$/i);
    
    if (matchLinhaBloco) {
      const numeroBloco = matchLinhaBloco[1].trim().toUpperCase();
      const materialBruto = matchLinhaBloco[2].trim();
      const restanteLinha = matchLinhaBloco[3].trim();
      
      // Evitar blocos duplicados acidentais
      if (blocosJaAdicionados.has(numeroBloco)) {
        continue;
      }
      blocosJaAdicionados.add(numeroBloco);

      const materialNormalizado = normalizarMaterialVermont(materialBruto);

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
        pedreira_id: pedreiraDetectada.id,
        pedreira_nome: pedreiraDetectada.nome,
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

  return {
    sucesso: true,
    numeroRomaneio,
    dataEmissao,
    dataSaida,
    pedreira: pedreiraDetectada,
    cliente: {
      nome: clienteNome,
      cnpj: clienteCnpj
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
  return processarRomaneioPdfTexto(texto);
};
