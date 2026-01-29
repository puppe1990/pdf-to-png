
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import { ConversionResult, PagePreview } from '../types';

// Pinagem da versão para corresponder exatamente ao importmap no index.html.
// O uso do sufixo .mjs é obrigatório para Workers em ambientes ESM modernos.
const PDFJS_VERSION = '5.4.530';
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.mjs`;

export const convertPdfToZip = async (
  file: File,
  onProgress: (progress: number) => void
): Promise<ConversionResult> => {
  const arrayBuffer = await file.arrayBuffer();
  
  // getDocument retorna uma tarefa de carregamento.
  // Incluímos standardFontDataUrl para garantir que fontes comuns do PDF sejam renderizadas sem erro.
  const loadingTask = pdfjsLib.getDocument({
    data: arrayBuffer,
    standardFontDataUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/standard_fonts/`,
  });

  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const zip = new JSZip();
  const previews: PagePreview[] = [];

  const baseFileName = file.name.replace(/\.[^/.]+$/, "");

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    // Escala 2.0 garante uma qualidade nítida (Retina).
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Não foi possível criar o contexto do canvas');

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    // Converte para Blob para adicionar ao ZIP
    const blob = await new Promise<Blob | null>((resolve) => 
      canvas.toBlob((b) => resolve(b), 'image/png')
    );

    if (blob) {
      zip.file(`${baseFileName}_page_${i}.png`, blob);
      
      // Armazena um preview menor para a interface para economizar memória
      const previewUrl = canvas.toDataURL('image/png', 0.3);
      previews.push({ pageNumber: i, dataUrl: previewUrl });
    }

    onProgress(Math.round((i / numPages) * 100));
    
    // Limpeza manual do canvas para ajudar o Garbage Collector
    canvas.width = 0;
    canvas.height = 0;
  }

  // Gera o ZIP sem compressão adicional, já que PNGs já são comprimidos.
  const zipBlob = await zip.generateAsync({ type: 'blob' });

  return {
    zipBlob,
    previews,
    fileName: `${baseFileName}_images.zip`
  };
};
