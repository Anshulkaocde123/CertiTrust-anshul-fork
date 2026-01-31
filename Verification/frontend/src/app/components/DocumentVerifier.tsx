import React, { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "motion/react";
import { Upload, FileText, CheckCircle, AlertTriangle, RefreshCcw, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { cn } from "@/lib/utils";
import { projectId, publicAnonKey } from "/utils/supabase/info";

type VerificationStatus = "idle" | "uploading" | "analyzing" | "complete" | "error";

interface VerificationResult {
  score: number;
  verdict: "Real" | "Fake" | "Tampered";
  details: string;
}

export function DocumentVerifier() {
  const [status, setStatus] = useState<VerificationStatus>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setStatus("analyzing");
      setProgress(0);
      setErrorMessage("");

      // Start verification
      verifyDocument(selectedFile);
    }
  }, []);

  const verifyDocument = async (fileToVerify: File) => {
    try {
      // 1. Start progress simulation (visual feedback)
      const startTime = Date.now();
      
      // 2. Call Backend
      const formData = new FormData();
      formData.append("file", fileToVerify);

      const responsePromise = fetch(`https://${projectId}.supabase.co/functions/v1/make-server-68c3da2b/verify`, {
        method: "POST",
        headers: {
           "Authorization": `Bearer ${publicAnonKey}`
        },
        body: formData
      });

      // Artificial progress pacer
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += Math.random() * 5;
        if (currentProgress > 90) currentProgress = 90;
        setProgress(Math.floor(currentProgress));
      }, 200);

      const response = await responsePromise;
      
      if (!response.ok) {
        throw new Error(`Verification failed: ${response.statusText}`);
      }

      const data = await response.json();

      // Ensure minimum 2 seconds of "analysis" for UX
      const elapsedTime = Date.now() - startTime;
      const minDuration = 2000;
      if (elapsedTime < minDuration) {
        await new Promise(resolve => setTimeout(resolve, minDuration - elapsedTime));
      }

      clearInterval(interval);
      setProgress(100);
      
      setTimeout(() => {
        setResult({
          score: data.score,
          verdict: data.verdict,
          details: data.details
        });
        setStatus("complete");
      }, 500);

    } catch (error) {
      console.error("Verification error:", error);
      setErrorMessage("Failed to verify document. Please try again.");
      setStatus("error");
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
      'application/msword': ['.doc', '.docx'],
    },
    maxFiles: 1,
    multiple: false
  });

  const resetVerification = () => {
    setStatus("idle");
    setFile(null);
    setResult(null);
    setProgress(0);
    setErrorMessage("");
  };

  const getVerdictDetails = (verdict: string) => {
    switch (verdict) {
      case "Real": return { color: "text-green-600", bg: "bg-green-100", border: "border-green-200", icon: ShieldCheck };
      case "Fake": return { color: "text-red-600", bg: "bg-red-100", border: "border-red-200", icon: ShieldX };
      case "Tampered": return { color: "text-amber-600", bg: "bg-amber-100", border: "border-amber-200", icon: ShieldAlert };
      default: return { color: "text-gray-600", bg: "bg-gray-100", border: "border-gray-200", icon: ShieldCheck };
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 relative">
        
        {/* Header */}
        <div className="p-8 pb-4 text-center bg-white z-10 relative">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Document Trust Verifier</h1>
          <p className="text-gray-500">Upload a document to verify its authenticity using our advanced AI engine.</p>
        </div>

        <div className="p-8 pt-4 min-h-[400px] flex flex-col justify-center relative">
          <AnimatePresence mode="wait">
            
            {/* Idle State - Dropzone */}
            {(status === "idle" || status === "error") && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {status === "error" && (
                   <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm text-center border border-red-100">
                     {errorMessage}
                   </div>
                )}

                <div
                  {...getRootProps()}
                  className={cn(
                    "border-3 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 group",
                    isDragActive 
                      ? "border-blue-500 bg-blue-50 scale-[1.02]" 
                      : "border-gray-200 hover:border-blue-400 hover:bg-gray-50"
                  )}
                >
                  <input {...getInputProps()} />
                  <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                    <Upload className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    {isDragActive ? "Drop the file here..." : "Drag & drop your document"}
                  </h3>
                  <p className="text-gray-500 mb-6 text-sm">Supported formats: PDF, JPG, PNG, DOCX</p>
                  <button className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium shadow-md hover:bg-blue-700 transition-colors">
                    Select Document
                  </button>
                </div>
              </motion.div>
            )}

            {/* Analyzing State */}
            {status === "analyzing" && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center w-full"
              >
                <div className="mb-10 relative w-40 h-40 mx-auto">
                   {/* Scanning Effect Overlay */}
                   <motion.div 
                     className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-400/20 to-transparent w-full h-1/4 z-10 blur-sm"
                     animate={{ top: ["0%", "100%", "0%"] }}
                     transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                   />
                   
                   <div className="w-full h-full bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden relative">
                      <FileText className="w-16 h-16 text-gray-300" />
                      {/* Progress Circle Overlay */}
                      <svg className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none">
                        <circle
                          cx="80"
                          cy="80"
                          r="76"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="transparent"
                          className="text-gray-100"
                        />
                        <circle
                          cx="80"
                          cy="80"
                          r="76"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="transparent"
                          strokeDasharray={477}
                          strokeDashoffset={477 - (477 * progress) / 100}
                          className="text-blue-500 transition-all duration-200 ease-out"
                          strokeLinecap="round"
                        />
                      </svg>
                   </div>
                </div>
                
                <h3 className="text-2xl font-semibold text-gray-800 mb-2">Verifying Document...</h3>
                <p className="text-gray-500 animate-pulse mb-8">Analyzing metadata and content integrity</p>
                
                <div className="w-64 mx-auto flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <span>Upload</span>
                  <span>Analysis</span>
                  <span>Result</span>
                </div>
                <div className="w-64 mx-auto mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                   <motion.div 
                      className="h-full bg-blue-500" 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                   />
                </div>
              </motion.div>
            )}

            {/* Complete State - Result */}
            {status === "complete" && result && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="flex flex-col items-center w-full"
              >
                {(() => {
                  const { color, bg, border, icon: Icon } = getVerdictDetails(result.verdict);
                  return (
                    <>
                      <div className="relative mb-8">
                        <div className={cn(
                          "w-40 h-40 rounded-full flex flex-col items-center justify-center border-8 shadow-sm transition-colors duration-500 bg-white",
                          border,
                          color
                        )}>
                          <span className="block text-5xl font-bold tracking-tighter">{result.score}%</span>
                          <span className="text-xs font-bold uppercase tracking-widest opacity-70 mt-1">Trust Score</span>
                        </div>
                        <div className={cn(
                          "absolute -bottom-3 -right-3 w-14 h-14 rounded-full flex items-center justify-center border-4 border-white shadow-lg",
                          result.verdict === "Real" ? "bg-green-500" : (result.verdict === "Fake" ? "bg-red-500" : "bg-amber-500")
                        )}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                      </div>

                      <div className={cn(
                        "px-8 py-2 rounded-full font-bold text-xl mb-6 uppercase tracking-wider shadow-sm",
                        bg, color
                      )}>
                        {result.verdict}
                      </div>

                      <div className="w-full bg-gray-50 rounded-xl p-6 mb-8 border border-gray-100 text-center">
                        <p className="text-gray-700 leading-relaxed font-medium">
                          {result.details}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 w-full mb-8 text-sm">
                         <div className="flex flex-col items-center p-3 rounded-lg bg-white border border-gray-100 shadow-sm">
                            <span className="text-gray-400 text-xs uppercase font-bold mb-1">File Name</span>
                            <span className="font-medium text-gray-800 truncate max-w-[120px]" title={file?.name}>{file?.name}</span>
                         </div>
                         <div className="flex flex-col items-center p-3 rounded-lg bg-white border border-gray-100 shadow-sm">
                            <span className="text-gray-400 text-xs uppercase font-bold mb-1">File Size</span>
                            <span className="font-medium text-gray-800">{(file?.size ? file.size / 1024 : 0).toFixed(1)} KB</span>
                         </div>
                      </div>

                      <button 
                        onClick={resetVerification}
                        className="flex items-center gap-2 px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all active:scale-95 font-medium shadow-lg hover:shadow-xl"
                      >
                        <RefreshCcw className="w-4 h-4" />
                        Verify Another Document
                      </button>
                    </>
                  );
                })()}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
