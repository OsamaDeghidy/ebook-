import React, { useState, useRef } from 'react';
import { Upload, FileText, Image, Sparkles, BookOpen, AlertCircle, RefreshCw, X } from 'lucide-react';

interface ContentUploaderProps {
  onConvert: (payload: {
    promptText: string;
    fileBase64?: string;
    fileName?: string;
    fileType?: string;
  }) => void;
  isConverting: boolean;
  progressPercent?: number;
  progressStep?: string;
}

export default function ContentUploader({
  onConvert,
  isConverting,
  progressPercent,
  progressStep,
}: ContentUploaderProps) {
  const [promptText, setPromptText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: string; type: string; base64?: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to format byte sizes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Convert File to Base64
  const processFile = (file: File) => {
    setErrorMsg(null);
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
    
    if (!validTypes.includes(file.type)) {
      setErrorMsg("Invalid file format. Please upload a PDF or an Image (PNG, JPG, WEBP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB Limit
      setErrorMsg("File is too large. Please upload files smaller than 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      setSelectedFile({
        name: file.name,
        size: formatBytes(file.size),
        type: file.type,
        base64: base64String
      });
    };
    reader.onerror = () => {
      setErrorMsg("Error reading file. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  // Drag and Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const clearSelectedFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim() && !selectedFile) {
      setErrorMsg("Please provide some study material (paste text, specify a topic, or drag-and-drop a PDF/image).");
      return;
    }

    onConvert({
      promptText,
      fileBase64: selectedFile?.base64,
      fileName: selectedFile?.name,
      fileType: selectedFile?.type
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 max-w-3xl mx-auto">
      
      <div className="space-y-2 mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-5.5 h-5.5 text-indigo-600 animate-pulse" />
          Create Interactive Ebook
        </h2>
        <p className="text-xs text-gray-500 leading-relaxed">
          Upload any PDF textbook, a snapshot image of a diagram, or paste a blog post/lecture notes. Our system automatically categorizes the input volume and constructs an interactive ebook complete with narrated soundtracks, modular tests, mind maps, and curated tutorial search linkages.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* DRAG AND DROP ZONE */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerFileSelect}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-indigo-500 bg-indigo-50/40'
              : selectedFile
              ? 'border-emerald-200 bg-emerald-50/10'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFileInputChange}
            disabled={isConverting}
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            {selectedFile ? (
              <>
                <div className={`p-3 rounded-xl ${selectedFile.type === 'application/pdf' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                  {selectedFile.type === 'application/pdf' ? (
                    <FileText className="w-8 h-8" />
                  ) : (
                    <Image className="w-8 h-8" />
                  )}
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm text-gray-800 flex items-center justify-center gap-1.5">
                    {selectedFile.name}
                    <button
                      type="button"
                      onClick={clearSelectedFile}
                      className="p-1 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600 transition"
                      title="Remove file"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </h4>
                  <p className="text-xs text-gray-400 font-medium">{selectedFile.type.toUpperCase()} • {selectedFile.size}</p>
                </div>
              </>
            ) : (
              <>
                <div className="p-3.5 bg-slate-100 rounded-full text-slate-400 group-hover:text-slate-600 transition">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-700">Drag & drop your files here, or <span className="text-indigo-600 underline">browse</span></p>
                  <p className="text-xs text-gray-400">Supports PDF textbooks or JPG/PNG/WEBP snapshot illustrations up to 10MB</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* PROMPT / TEXT PASTING ZONE */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">
            Subject Matter, Prompt, or Pasted Text
          </label>
          <textarea
            placeholder="Paste your blog article, copy-paste ebook transcripts, list key chapters you want created, or enter a prompt (e.g. 'Build an ebook explaining Quantum Physics in simple, story-like lessons for high schoolers')."
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            disabled={isConverting}
            rows={5}
            className="w-full text-xs p-3.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition resize-none leading-relaxed"
          />
        </div>

        {/* AI SIZE AUTO-DETECTION MESSAGE */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-3 text-xs">
          <div className="flex items-start gap-3 text-indigo-800">
            <Sparkles className="w-5 h-5 shrink-0 text-indigo-600 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800 mb-1 text-sm">How AI Determines Chapters & Volume Scale</p>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Our conversion engine runs a multi-sensory token evaluation. It scans your document, analyzes page count and prompt complexity, and establishes high-range layouts:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mt-2.5">
                <div className="bg-white border rounded-lg p-2.5">
                  <span className="font-bold text-indigo-600 block text-[10px] uppercase font-mono">Short (1-10 Pages)</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Creates 1-2 highly dense, focused core chapters covering immediate lessons.</p>
                </div>
                <div className="bg-white border rounded-lg p-2.5">
                  <span className="font-bold text-indigo-600 block text-[10px] uppercase font-mono">Medium (10-50 Pages)</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Assembles 3-4 deep chapters with sequential knowledge chains.</p>
                </div>
                <div className="bg-white border rounded-lg p-2.5">
                  <span className="font-bold text-indigo-600 block text-[10px] uppercase font-mono">Long (50-200 Pages)</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Segments content into 5-6 comprehensive chapters. Expand up to 50+ chapters in the Workspace Editor!</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ACTIVE CONVERSION PROGRESS DISPLAY */}
        {isConverting && <ConversionProgressTracker percent={progressPercent} step={progressStep} />}

        {/* ERROR MESSAGES */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2.5 text-xs text-rose-700 animate-fadeIn">
            <AlertCircle className="w-4.5 h-4.5 shrink-0 text-rose-600" />
            <p className="font-medium">{errorMsg}</p>
          </div>
        )}

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={isConverting}
          className={`w-full py-3.5 rounded-xl font-bold text-sm text-white transition flex items-center justify-center gap-2 shadow-sm ${
            isConverting
              ? 'bg-slate-800 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 active:translate-y-[1px]'
          }`}
        >
          {isConverting ? (
            <>
              <RefreshCw className="w-4.5 h-4.5 animate-spin" />
              <span>AI is Working... Creating Ebook</span>
            </>
          ) : (
            <>
              <BookOpen className="w-4.5 h-4.5" />
              <span>Convert into Interactive Ebook</span>
            </>
          )}
        </button>

      </form>

    </div>
  );
}

// Sub-component to show live AI conversion progress steps
interface ProgressTrackerProps {
  percent?: number;
  step?: string;
}

function ConversionProgressTracker({ percent, step }: ProgressTrackerProps) {
  const [localStep, setLocalStep] = React.useState(0);
  
  const steps = [
    { label: "Parsing uploads & measuring document token length", desc: "Analyzing characters, formatting styles, and page layouts" },
    { label: "Segmenting course structure & detecting volume size", desc: "Determining divisions for high-range text volumes" },
    { label: "Writing rich-markdown chapter explanations via Gemini", desc: "Compiling detailed prose with headers, key terms, and summaries" },
    { label: "Constructing interactive concept tree nodes for Mind Map", desc: "Establishing parents and relationships dynamically" },
    { label: "Drafting educational multiple choice question checkpoints", desc: "Creating options, correct indices, and detailed explanations" },
    { label: "Curating direct YouTube visual integrations", desc: "Locating highly descriptive, play-ready supplemental videos" },
    { label: "Binding your custom digital learning textbook", desc: "Readying the interactive bookshelf, audio trackers, and editor" }
  ];

  React.useEffect(() => {
    if (percent === undefined) {
      const timer = setInterval(() => {
        setLocalStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
      }, 3500);
      return () => clearInterval(timer);
    }
  }, [percent, steps.length]);

  const displayPercent = percent !== undefined ? percent : Math.round(((localStep + 1) / steps.length) * 100);
  const displayStepText = step || steps[Math.min(localStep, steps.length - 1)].label;

  return (
    <div className="p-5 border border-indigo-100 bg-indigo-50/20 rounded-2xl space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide font-mono flex items-center gap-1.5 animate-pulse">
          <Sparkles className="w-4 h-4" /> AI Active Conversion Pipeline
        </span>
        <span className="text-xs font-bold text-indigo-600">{displayPercent}%</span>
      </div>

      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className="bg-indigo-600 h-full transition-all duration-500" 
          style={{ width: `${displayPercent}%` }} 
        />
      </div>

      <div className="bg-white/70 border border-indigo-100/40 p-4 rounded-xl shadow-xs space-y-1">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0" />
          <span className="font-bold text-indigo-950 font-mono text-[10px] uppercase tracking-wider">Active Engine Stage:</span>
        </div>
        <p className="text-[11.5px] text-slate-700 leading-relaxed font-medium pl-5">
          {displayStepText}
        </p>
      </div>
    </div>
  );
}
