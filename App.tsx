
import React, { useState, useCallback, useRef } from 'react';
import { 
  FileUp, 
  FileArchive, 
  Download, 
  RefreshCcw, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { AppStatus, ConversionResult } from './types';
import { convertPdfToZip } from './services/pdfService';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [progress, setProgress] = useState<number>(0);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setStatus(AppStatus.IDLE);
      setResult(null);
      setErrorMessage('');
    } else if (selectedFile) {
      setErrorMessage('Por favor, selecione um arquivo PDF válido.');
    }
  };

  const startConversion = async () => {
    if (!file) return;

    try {
      setStatus(AppStatus.PROCESSING);
      setProgress(0);
      
      const conversionResult = await convertPdfToZip(file, (p) => {
        setProgress(p);
      });

      setResult(conversionResult);
      setStatus(AppStatus.COMPLETED);
    } catch (error: any) {
      console.error('Falha na conversão:', error);
      setStatus(AppStatus.ERROR);
      setErrorMessage(error.message || 'Ocorreu um erro ao processar o PDF. Certifique-se de que o arquivo não está corrompido.');
    }
  };

  const downloadZip = () => {
    if (!result) return;
    const url = URL.createObjectURL(result.zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = result.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFile(null);
    setStatus(AppStatus.IDLE);
    setResult(null);
    setProgress(0);
    setErrorMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-8">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <header className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <FileArchive className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">PDF to PNG Zip</h1>
          </div>
          <p className="text-blue-100 text-lg">Converta cada página do seu PDF em imagens PNG de alta qualidade instantaneamente.</p>
        </header>

        <main className="p-8">
          {status === AppStatus.IDLE && !result && (
            <div className="space-y-6">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all
                  ${file ? 'border-blue-400 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'}
                `}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="application/pdf"
                  className="hidden"
                />
                
                {file ? (
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-blue-600 p-4 rounded-full mb-4 shadow-lg shadow-blue-200">
                      <FileText className="w-12 h-12 text-white" />
                    </div>
                    <p className="text-xl font-semibold text-slate-800 mb-1">{file.name}</p>
                    <p className="text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-slate-100 p-4 rounded-full mb-4">
                      <FileUp className="w-12 h-12 text-slate-400" />
                    </div>
                    <p className="text-xl font-semibold text-slate-800 mb-2">Selecione ou arraste seu PDF</p>
                    <p className="text-slate-500">Clique para navegar nos seus arquivos</p>
                  </div>
                )}
              </div>

              {errorMessage && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3 border border-red-100 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p>{errorMessage}</p>
                </div>
              )}

              {file && (
                <button 
                  onClick={startConversion}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 group"
                >
                  <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                  Converter para PNG
                </button>
              )}
            </div>
          )}

          {status === AppStatus.PROCESSING && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
              <div className="relative">
                <Loader2 className="w-20 h-20 text-blue-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center font-bold text-blue-600">
                  {progress}%
                </div>
              </div>
              <div className="space-y-2 w-full max-w-md">
                <h2 className="text-2xl font-bold text-slate-800">Processando seu PDF...</h2>
                <p className="text-slate-500">Isso pode levar alguns segundos dependendo do tamanho do arquivo.</p>
                <div className="w-full bg-slate-100 rounded-full h-3 mt-4 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {status === AppStatus.COMPLETED && result && (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex flex-col items-center text-center bg-green-50 p-8 rounded-2xl border border-green-100">
                <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
                <h2 className="text-2xl font-bold text-slate-800 mb-1">Conversão Concluída!</h2>
                <p className="text-slate-600 mb-6">Todas as {result.previews.length} páginas foram convertidas com sucesso.</p>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                  <button 
                    onClick={downloadZip}
                    className="flex-1 max-w-xs bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Download className="w-5 h-5" />
                    Baixar ZIP ({ (result.zipBlob.size / (1024 * 1024)).toFixed(2) } MB)
                  </button>
                  <button 
                    onClick={reset}
                    className="flex-1 max-w-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-2 transition-all"
                  >
                    <RefreshCcw className="w-5 h-5" />
                    Novo Arquivo
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <ImageIcon className="w-5 h-5 text-slate-400" />
                  <h3 className="text-lg font-semibold text-slate-700">Pré-visualização das Páginas</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {result.previews.map((prev) => (
                    <div key={prev.pageNumber} className="group relative aspect-[3/4] rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shadow-sm hover:shadow-md transition-all">
                      <img 
                        src={prev.dataUrl} 
                        alt={`Página ${prev.pageNumber}`} 
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-slate-900/60 backdrop-blur-sm p-1 text-center">
                        <span className="text-xs font-medium text-white">Página {prev.pageNumber}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {status === AppStatus.ERROR && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in">
              <div className="bg-red-100 p-4 rounded-full">
                <AlertCircle className="w-16 h-16 text-red-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-800">Ops! Algo deu errado</h2>
                <p className="text-red-600 max-w-md">{errorMessage}</p>
              </div>
              <button 
                onClick={reset}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all flex items-center gap-2"
              >
                <RefreshCcw className="w-5 h-5" />
                Tentar Novamente
              </button>
            </div>
          )}
        </main>

        <footer className="bg-slate-50 border-t border-slate-100 p-6 text-center text-slate-400 text-sm">
          <p>© {new Date().getFullYear()} PDF to PNG Converter • Processamento local e seguro</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
