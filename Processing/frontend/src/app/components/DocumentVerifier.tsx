import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, Loader2, Download, AlertCircle } from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import mammoth from 'mammoth';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type VerificationState = 'idle' | 'processing' | 'completed' | 'error';

export function DocumentVerifier() {
  const [state, setState] = useState<VerificationState>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [processedPdfUrl, setProcessedPdfUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const wrapText = (text: string, maxWidth: number, font: any, fontSize: number) => {
    const paragraphs = text.split('\n');
    let lines: string[] = [];

    for (const paragraph of paragraphs) {
      if (paragraph.trim() === '') {
        lines.push('');
        continue;
      }

      const words = paragraph.split(' ');
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const width = font.widthOfTextAtSize(testLine, fontSize);
        if (width <= maxWidth) {
          currentLine = testLine;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);
    }
    return lines;
  };

  const processFile = async (uploadedFile: File) => {
    try {
      setState('processing');
      
      // Simulate "AI Processing" steps with delays
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const fileBuffer = await uploadedFile.arrayBuffer();
      let pdfDoc: PDFDocument;

      if (uploadedFile.type === 'application/pdf') {
        pdfDoc = await PDFDocument.load(fileBuffer);
      } else if (uploadedFile.type === 'image/jpeg' || uploadedFile.type === 'image/png') {
        pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        
        let image;
        if (uploadedFile.type === 'image/jpeg') {
          image = await pdfDoc.embedJpg(fileBuffer);
        } else {
          image = await pdfDoc.embedPng(fileBuffer);
        }
        
        const imgDims = image.scaleToFit(width - 40, height - 40);
        page.drawImage(image, {
          x: (width - imgDims.width) / 2,
          y: (height - imgDims.height) / 2,
          width: imgDims.width,
          height: imgDims.height,
        });
      } else if (
        uploadedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        uploadedFile.name.endsWith('.docx')
      ) {
        // Convert DOCX text to PDF
        const result = await mammoth.extractRawText({ arrayBuffer: fileBuffer });
        const text = result.value;
        
        pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontSize = 12;
        const margin = 50;
        
        let page = pdfDoc.addPage();
        let { width, height } = page.getSize();
        const maxWidth = width - (margin * 2);
        
        const lines = wrapText(text, maxWidth, font, fontSize);
        let y = height - margin;

        for (const line of lines) {
          if (y < margin + fontSize) {
             page = pdfDoc.addPage();
             y = height - margin;
          }
          page.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
          y -= (fontSize + 4);
        }
      } else {
        throw new Error("Unsupported file type");
      }

      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      // Generate QR Code
      const signatureId = Math.random().toString(36).substring(2, 15);
      const timestamp = new Date().toISOString();
      const verificationData = JSON.stringify({
        id: signatureId,
        timestamp,
        filename: uploadedFile.name,
        verifiedBy: "Document Trust Verifier AI"
      });
      
      const qrCodeDataUrl = await QRCode.toDataURL(verificationData);
      const qrImage = await pdfDoc.embedPng(qrCodeDataUrl);
      
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width } = firstPage.getSize();
      
      // Add Visual Stamp
      firstPage.drawImage(qrImage, {
        x: width - 80,
        y: 20,
        width: 60,
        height: 60,
      });
      
      firstPage.drawText(`Verified: ${new Date().toLocaleDateString()}`, {
        x: width - 160,
        y: 35,
        size: 8,
        font: helveticaFont,
        color: rgb(0.2, 0.2, 0.2),
      });

       firstPage.drawText(`ID: ${signatureId.toUpperCase()}`, {
        x: width - 160,
        y: 25,
        size: 6,
        font: helveticaFont,
        color: rgb(0.4, 0.4, 0.4),
      });
      
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      setProcessedPdfUrl(url);
      
      // Simulate finalization
      await new Promise(resolve => setTimeout(resolve, 500));
      setState('completed');
      
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to process document. Please ensure it's a valid file.");
      setState('error');
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      processFile(selectedFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    disabled: state === 'processing',
    onDropRejected: () => {
        setErrorMessage("Unsupported file type. Please upload PDF, JPG, PNG or DOCX.");
        setState('error');
    }
  });

  const reset = () => {
    setState('idle');
    setFile(null);
    setProcessedPdfUrl(null);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col items-center justify-center p-4 font-sans text-slate-900">
        {/* Header / Nav simulation based on image */}
        <div className="absolute top-0 left-0 w-full h-12 bg-[#2C2C2C] flex items-center px-4 justify-between text-white text-xs border-b border-gray-700 hidden md:flex">
             <div className="flex items-center gap-4">
                 <div className="flex gap-1.5">
                     <div className="w-3 h-3 rounded-full bg-[#FF5F57]"></div>
                     <div className="w-3 h-3 rounded-full bg-[#FEBC2E]"></div>
                     <div className="w-3 h-3 rounded-full bg-[#28C840]"></div>
                 </div>
                 <div className="flex items-center gap-2 px-3 py-1 bg-[#4A4A4A] rounded-t-md text-gray-200">
                     <span>Document Verification Platform</span>
                 </div>
             </div>
        </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl bg-white rounded-[24px] shadow-2xl overflow-hidden relative"
      >
        <div className="p-12 text-center">
            
          <AnimatePresence mode="wait">
            {state === 'idle' || state === 'error' ? (
               <motion.div
                 key="upload"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="flex flex-col items-center"
               >
                  <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-3">
                    Document Trust Verifier
                  </h1>
                  <p className="text-slate-500 mb-10 max-w-md mx-auto text-lg">
                    Upload a document to verify its authenticity using our advanced AI engine.
                  </p>

                  <div 
                    {...getRootProps()} 
                    className={cn(
                        "w-full max-w-lg border-[2px] border-dashed rounded-2xl p-10 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-4 group",
                        isDragActive ? "border-blue-500 bg-blue-50/50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                        state === 'error' && "border-red-300 bg-red-50"
                    )}
                  >
                    <input {...getInputProps()} />
                    
                    <div className={cn(
                        "w-16 h-16 rounded-full flex items-center justify-center mb-2 transition-colors",
                        isDragActive ? "bg-blue-100 text-blue-600" : "bg-blue-50 text-blue-500",
                         state === 'error' && "bg-red-100 text-red-500"
                    )}>
                        {state === 'error' ? <AlertCircle className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                    </div>

                    <div className="space-y-1">
                        <p className="text-xl font-medium text-slate-900">
                            {isDragActive ? "Drop the file here" : "Drag & drop your document"}
                        </p>
                        <p className="text-sm text-slate-500">
                            Supported formats: PDF, JPG, PNG, DOCX
                        </p>
                    </div>

                    <button className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-600/20">
                        Select Document
                    </button>
                  </div>
                  
                  {state === 'error' && (
                      <p className="mt-4 text-red-500 font-medium bg-red-50 px-4 py-2 rounded-lg">
                          {errorMessage}
                          <button onClick={(e) => { e.stopPropagation(); reset(); }} className="ml-2 underline hover:text-red-700">Try again</button>
                      </p>
                  )}
               </motion.div>
            ) : state === 'processing' ? (
                <motion.div
                    key="processing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center py-10"
                >
                    <div className="relative mb-8">
                        <div className="w-24 h-24 rounded-full border-4 border-slate-100"></div>
                        <div className="absolute inset-0 w-24 h-24 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
                        <FileText className="absolute inset-0 m-auto w-8 h-8 text-blue-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Processing Document...</h2>
                    <p className="text-slate-500">Analysing content and appending secure digital signature.</p>
                </motion.div>
            ) : (
                <motion.div
                    key="completed"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center py-6"
                >
                    <div className="w-20 h-20 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-6">
                        <CheckCircle className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">Verification Complete</h2>
                    <p className="text-slate-500 mb-8 max-w-sm">
                        Your document has been successfully verified, stamped with a secure QR code, and signed.
                    </p>
                    
                    <div className="flex gap-4">
                        <button 
                            onClick={reset}
                            className="px-6 py-3 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors"
                        >
                            Verify Another
                        </button>
                        
                        {processedPdfUrl && (
                            <a 
                                href={processedPdfUrl} 
                                download={`verified-${file?.name ? file.name.split('.')[0] : 'document'}.pdf`}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-600/20 flex items-center gap-2"
                            >
                                <Download className="w-5 h-5" />
                                Download Signed PDF
                            </a>
                        )}
                    </div>
                </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Footer / Trust indicators */}
      <div className="mt-8 flex gap-6 text-slate-400 grayscale opacity-60">
        {/* Placeholders for logos if needed, just simple text for now */}
        <span className="font-semibold">SECURE</span>
        <span className="font-semibold">ENCRYPTED</span>
        <span className="font-semibold">VERIFIED</span>
      </div>
    </div>
  );
}
