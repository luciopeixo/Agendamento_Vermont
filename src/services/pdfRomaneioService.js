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
 * Analisa a seção OBSERVAÇÕES do romaneio e mapeia valores de envelopamento por bloco
 */
export const extrairObservacoesEEnvelopamento = (textoCompleto) => {
  const resultado = {
    textoObservacoes: '',
    semEnvelopamentoGeral: false,
    envelopamentoPorBloco: new Map() // bloco -> { valor, detalhe }
  };

  const idxObs = textoCompleto.search(/OBSERVA[ÇC][ÕO]ES/i);
  if (idxObs === -1) return resultado;

  let textoObs = textoCompleto.substring(idxObs);
  
  // Limpar rodapé de assinaturas se presente
  const idxAssinatura = textoObs.search(/Confirma[çc][ãa]o do Or[çc]amento|Assinatura:|Nome Leg[íi]vel:/i);
  if (idxAssinatura !== -1) {
    textoObs = textoObs.substring(0, idxAssinatura);
  }

  resultado.textoObservacoes = textoObs.trim();

  // Verificar se há declaração explícita "Sem envelopamento"
  if (/sem\s+envelopamento/i.test(textoObs)) {
    resultado.semEnvelopamentoGeral = true;
  }

  // Buscar linhas do tipo: "1826- R$ 3.617,60" ou "1926: R$ 3.740,88" ou "1826 - 3.617,60"
  // Aceita formatos de bloco como 1826, 839/26, etc.
  const regexBlocoValor = /(?:^|[\s\n\r])([0-9]{3,5}(?:\/[0-9]{2})?)\s*[-:]?\s*R?\$?\s*([\d.]+,\d{2})/gmi;
  let match;
  while ((match = regexBlocoValor.exec(textoObs)) !== null) {
    const numeroBloco = match[1].trim().toUpperCase();
    const valorStr = match[2].trim();
    const valorFloat = converterValorMonetarioParaFloat(valorStr);
    
    if (valorFloat > 0) {
      resultado.envelopamentoPorBloco.set(numeroBloco, {
        valor: valorFloat,
        valorFormatado: valorStr,
        detalhe: `Envelopamento nas Observações (R$ ${valorStr})`
      });
    }
  }

  return resultado;
};

/**
 * Parser principal de Romaneios em PDF da Vermont Mineração.
 * Recebe o texto extraído do PDF e aplica todas as regras de negócio para reconhecimento
 * de cabeçalho, blocos e status de envelopamento.
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
    // Limpar sufixos indesejados
    clienteNome = limparNomeEmpresa(clienteNome).toUpperCase();
  }

  // 5. Identificar CNPJ do Cliente
  let clienteCnpj = '';
  const matchCnpj = textoCompleto.match(/CNPJ\/CPF:\s*(\d{11,14}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/i);
  if (matchCnpj) {
    clienteCnpj = formatarCNPJ(matchCnpj[1]);
  }

  // 6. Extrair Seção de Observações e Valores de Envelopamento
  const infoObservacoes = extrairObservacoesEEnvelopamento(textoCompleto);

  // 7. Extrair Itens / Blocos da Tabela
  const linhas = textoCompleto.split('\n').map(l => l.trim()).filter(Boolean);
  const blocosDetectados = [];

  // Localizar o cabeçalho da tabela de blocos
  let inicioTabelaIdx = -1;
  for (let i = 0; i < linhas.length; i++) {
    if (/BLOCO\s+MATERIAL/i.test(linhas[i])) {
      inicioTabelaIdx = i + 1;
      break;
    }
  }

  // Se não achar o cabeçalho explícito, buscar a partir do início
  const idxComeco = inicioTabelaIdx !== -1 ? inicioTabelaIdx : 0;

  for (let i = idxComeco; i < linhas.length; i++) {
    const linha = linhas[i];

    // Fim da tabela ao atingir "Qtd:", "M2 / M3", "Cotação", "OBSERVAÇÕES", "TOTAL"
    if (/^(Qtd:|M2\s*\/|Cota[çc][ãa]o|OBSERVA[ÇC][ÕO]ES|TOTAL\s+GERAL)/i.test(linha)) {
      break;
    }

    // Padrão de linha de bloco Vermont:
    // Começa com número do bloco (ex: 839/26 ou 1826 ou 0326), seguido do nome do material
    const matchLinhaBloco = linha.match(/^([0-9]{3,5}(?:\/[0-9]{2})?|[0-9A-Z/-]+)\s+([A-ZÀ-Ú\s]+?)\s+(\d+[,.]\d{2,3}\s*x\s*.*)$/i);
    
    if (matchLinhaBloco) {
      const numeroBloco = matchLinhaBloco[1].trim().toUpperCase();
      const materialBruto = matchLinhaBloco[2].trim();
      const restanteLinha = matchLinhaBloco[3].trim();
      
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
      else if (infoObservacoes.envelopamentoPorBloco.has(numeroBloco)) {
        const infoObsBloco = infoObservacoes.envelopamentoPorBloco.get(numeroBloco);
        statusCalculado = 'pendente_envelopamento';
        motivoStatus = `Regra 2: ${infoObsBloco.detalhe}`;
        valorCobrado = infoObsBloco.valor;
      } 
      // REGRA 3: Não consta na coluna nem nas observações (ou observações dizem "Sem envelopamento")
      else {
        statusCalculado = 'sem_envelopamento';
        motivoStatus = infoObservacoes.semEnvelopamentoGeral
          ? 'Regra 3: Declarado "Sem envelopamento" nas observações'
          : 'Regra 3: Sem valor de envelopamento no romaneio';
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
