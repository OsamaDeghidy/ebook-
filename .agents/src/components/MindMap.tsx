import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, Info, Check, X, MoveRight, Mic, MicOff, Sparkles, RefreshCw, Languages } from 'lucide-react';
import { MindMapNode } from '../types';

interface MindMapProps {
  nodes: MindMapNode[];
  onUpdateNodes: (updatedNodes: MindMapNode[]) => void;
  ebookId?: string;
  chapterId?: string;
  chapterContent?: string;
}

export default function MindMap({ nodes, onUpdateNodes, ebookId, chapterId, chapterContent }: MindMapProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<MindMapNode | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // AI & Voice Pilot states
  const [isRecording, setIsRecording] = useState(false);
  const [voicePrompt, setVoicePrompt] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [speechLanguage, setSpeechLanguage] = useState<'ar-SA' | 'en-US'>('ar-SA');
  const [aiError, setAiError] = useState<string | null>(null);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  const startSpeechRecognition = () => {
    setAiError(null);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setAiError("Speech recognition is not supported in this browser. Please type your command manually below!");
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = speechLanguage;

      rec.onstart = () => {
        setIsRecording(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setVoicePrompt(prev => prev ? prev + " " + transcript : transcript);
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error", event);
        setAiError(`Voice recognition error: ${event.error || "Please try again"}`);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      rec.start();
      setRecognitionInstance(rec);
    } catch (err: any) {
      setAiError("Failed to start microphone: " + err.message);
      setIsRecording(false);
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionInstance) {
      try {
        recognitionInstance.stop();
      } catch (e) {}
    }
    setIsRecording(false);
  };

  const handleApplyAI = async () => {
    if (!voicePrompt.trim()) {
      setAiError("Please speak or type an instruction first!");
      return;
    }
    setIsProcessingAI(true);
    setAiError(null);
    try {
      const res = await fetch(`/api/ebooks/${ebookId}/chapters/${chapterId}/mindmap/ai-edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: voicePrompt,
          nodes,
          chapterContent
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to process AI mind map edit.");
      }

      const data = await res.json();
      if (data.success && data.nodes) {
        onUpdateNodes(data.nodes);
        setVoicePrompt('');
        setSelectedNodeId(null);
        setIsEditing(false);
        setIsAdding(false);
      } else {
        throw new Error(data.error || "Failed to modify mindmap with AI.");
      }
    } catch (err: any) {
      setAiError(err.message || "An error occurred during AI mind map update.");
    } finally {
      setIsProcessingAI(false);
    }
  };

  // Edit form state
  const [editLabel, setEditLabel] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editParentId, setEditParentId] = useState<string | null>(null);

  // Add form state
  const [addLabel, setAddLabel] = useState('');
  const [addDescription, setAddDescription] = useState('');
  const [addParentId, setAddParentId] = useState<string | null>(null);

  // Root nodes have parentId === null
  const rootNodes = useMemo(() => nodes.filter(n => !n.parentId), [nodes]);

  // Compute layout coordinates dynamically
  const layout = useMemo(() => {
    const coords: { [id: string]: { x: number; y: number; level: number } } = {};
    if (nodes.length === 0) return coords;

    // Helper to find descendants and assign levels
    const assignLevels = (nodeId: string, level: number, parentYStart: number, heightAllocated: number) => {
      const children = nodes.filter(n => n.parentId === nodeId);
      const x = 50 + level * 220; // 220px horizontal gap per level

      if (children.length === 0) {
        coords[nodeId] = { x, y: parentYStart, level };
        return;
      }

      // Distribute children vertically inside the allocated height
      const childHeight = heightAllocated / children.length;
      let currentY = parentYStart - heightAllocated / 2 + childHeight / 2;

      children.forEach((child) => {
        assignLevels(child.id, level + 1, currentY, childHeight);
        currentY += childHeight;
      });

      // Parent's Y is the average of children's Y coordinates
      const childrenYSum = children.reduce((sum, child) => sum + (coords[child.id]?.y || 0), 0);
      coords[nodeId] = { x, y: childrenYSum / children.length, level };
    };

    // Calculate vertical spacing based on total nodes
    const svgHeight = Math.max(360, nodes.length * 60);

    if (rootNodes.length === 0 && nodes.length > 0) {
      // If no root is explicitly defined, pick the first node as root fallback
      nodes[0].parentId = null;
    }

    const rootSpacing = svgHeight / (rootNodes.length || 1);
    rootNodes.forEach((root, idx) => {
      const rootY = rootSpacing * idx + rootSpacing / 2;
      assignLevels(root.id, 0, rootY, svgHeight * 0.8);
    });

    return coords;
  }, [nodes, rootNodes]);

  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId) || null, [nodes, selectedNodeId]);

  // Trigger editing form
  const startEdit = (node: MindMapNode) => {
    setEditLabel(node.label);
    setEditDescription(node.description || '');
    setEditParentId(node.parentId);
    setIsEditing(true);
    setIsAdding(false);
  };

  const handleSaveEdit = () => {
    if (!selectedNodeId || !editLabel.trim()) return;
    const updated = nodes.map(n => {
      if (n.id === selectedNodeId) {
        return { ...n, label: editLabel, description: editDescription, parentId: editParentId };
      }
      return n;
    });
    onUpdateNodes(updated);
    setIsEditing(false);
  };

  const handleAddNode = () => {
    if (!addLabel.trim()) return;
    const newNodeId = `m-node-${Date.now()}`;
    const newNode: MindMapNode = {
      id: newNodeId,
      label: addLabel,
      parentId: addParentId || (selectedNodeId || null), // Default to selected node as parent
      description: addDescription
    };
    onUpdateNodes([...nodes, newNode]);
    setAddLabel('');
    setAddDescription('');
    setIsAdding(false);
    setSelectedNodeId(newNodeId);
  };

  const handleDeleteNode = (nodeId: string) => {
    // Cascade delete: delete node and update its children to have the deleted node's parent
    const nodeToDelete = nodes.find(n => n.id === nodeId);
    const parentId = nodeToDelete ? nodeToDelete.parentId : null;

    const updated = nodes
      .filter(n => n.id !== nodeId)
      .map(n => {
        if (n.parentId === nodeId) {
          return { ...n, parentId }; // connect children to grandparent
        }
        return n;
      });

    onUpdateNodes(updated);
    setSelectedNodeId(null);
    setIsEditing(false);
  };

  // Dimensions of SVG canvas
  const svgWidth = 800;
  const svgHeight = Math.max(400, nodes.length * 65);

  return (
    <div id="mindmap-container" className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white p-4 rounded-xl border border-gray-200">
      
      {/* Mind Map Interactive Canvas */}
      <div className="lg:col-span-2 relative overflow-auto border border-gray-100 rounded-lg bg-gray-50/50 p-2 max-h-[500px]">
        {nodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Info className="w-8 h-8 mb-2" />
            <p className="text-sm">No mind map concepts defined. Click 'Add Concept' to start.</p>
          </div>
        ) : (
          <svg width={svgWidth} height={svgHeight} className="mx-auto overflow-visible select-none">
            {/* Draw connecting curves */}
            {nodes.map((node) => {
              if (!node.parentId) return null;
              const parentCoord = layout[node.parentId];
              const nodeCoord = layout[node.id];
              if (!parentCoord || !nodeCoord) return null;

              // Draw beautiful Bezier curves
              const midX = (parentCoord.x + nodeCoord.x) / 2;
              const pathData = `M ${parentCoord.x} ${parentCoord.y} 
                               C ${midX} ${parentCoord.y}, 
                                 ${midX} ${nodeCoord.y}, 
                                 ${nodeCoord.x} ${nodeCoord.y}`;

              return (
                <path
                  key={`link-${node.id}`}
                  d={pathData}
                  fill="none"
                  stroke={selectedNodeId === node.id || selectedNodeId === node.parentId ? '#10b981' : '#cbd5e1'}
                  strokeWidth={selectedNodeId === node.id || selectedNodeId === node.parentId ? 2.5 : 1.5}
                  className="transition-all duration-300 ease-in-out"
                />
              );
            })}

            {/* Draw nodes */}
            {nodes.map((node) => {
              const coord = layout[node.id];
              if (!coord) return null;

              const isSelected = selectedNodeId === node.id;
              const isHovered = hoveredNode?.id === node.id;

              return (
                <g
                  key={`node-${node.id}`}
                  transform={`translate(${coord.x}, ${coord.y})`}
                  className="cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNodeId(node.id);
                  }}
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  {/* Glowing hover state circle */}
                  <circle
                    r={isSelected ? 26 : 22}
                    fill="none"
                    stroke={isSelected ? '#10b981' : '#3b82f6'}
                    strokeWidth={isSelected || isHovered ? 3 : 0}
                    className="opacity-40 transition-all duration-300"
                  />

                  {/* Node Capsule Background */}
                  <rect
                    x={-80}
                    y={-18}
                    width={160}
                    height={36}
                    rx={18}
                    fill={isSelected ? '#10b981' : '#ffffff'}
                    stroke={isSelected ? '#059669' : '#3b82f6'}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    className="shadow-sm transition-all duration-300"
                  />

                  {/* Node Label Text */}
                  <text
                    textAnchor="middle"
                    dy=".3em"
                    fontSize="11"
                    fontWeight={isSelected ? '600' : '500'}
                    fill={isSelected ? '#ffffff' : '#1e293b'}
                    className="pointer-events-none select-none overflow-hidden"
                  >
                    {node.label.length > 20 ? `${node.label.substring(0, 18)}...` : node.label}
                  </text>
                </g>
              );
            })}
          </svg>
        )}

        {/* Floating Concept Guide/Tooltip */}
        {hoveredNode && (
          <div className="absolute top-2 left-2 bg-slate-900 text-white text-xs p-3 rounded shadow-lg max-w-xs z-50 transition-opacity duration-200">
            <h4 className="font-semibold text-emerald-400 mb-1">{hoveredNode.label}</h4>
            <p className="leading-normal">{hoveredNode.description || "No concept description provided."}</p>
          </div>
        )}
      </div>

      {/* Editor & Control Sidebar */}
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/60 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              Concept Detail
            </h3>
            <button
              onClick={() => {
                setIsAdding(true);
                setIsEditing(false);
                setAddParentId(selectedNodeId);
              }}
              className="px-2 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded flex items-center gap-1 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Concept
            </button>
          </div>

          {/* ADD CONCEPT FORM */}
          {isAdding && (
            <div className="space-y-3 bg-white p-3 rounded border border-emerald-200 shadow-sm animate-fadeIn">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-emerald-700">Add New Concept</span>
                <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Concept Name</label>
                <input
                  type="text"
                  placeholder="e.g. RuBisCO Enzyme"
                  value={addLabel}
                  onChange={(e) => setAddLabel(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded mt-1 outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Description</label>
                <textarea
                  placeholder="Explain this concept in a simple sentence..."
                  value={addDescription}
                  onChange={(e) => setAddDescription(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-2 border border-slate-200 rounded mt-1 outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Parent Concept</label>
                <select
                  value={addParentId || ''}
                  onChange={(e) => setAddParentId(e.target.value || null)}
                  className="w-full text-xs p-2 border border-slate-200 rounded mt-1 outline-none"
                >
                  <option value="">[None - Root Level]</option>
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>{n.label}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleAddNode}
                className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded transition-all flex items-center justify-center gap-1"
              >
                <Check className="w-3.5 h-3.5" /> Save Concept
              </button>
            </div>
          )}

          {/* EDIT CONCEPT FORM */}
          {isEditing && selectedNode && (
            <div className="space-y-3 bg-white p-3 rounded border border-blue-200 shadow-sm animate-fadeIn">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-blue-700">Edit Concept</span>
                <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Concept Name</label>
                <input
                  type="text"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded mt-1 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-2 border border-slate-200 rounded mt-1 outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Parent Concept</label>
                <select
                  value={editParentId || ''}
                  onChange={(e) => setEditParentId(e.target.value || null)}
                  className="w-full text-xs p-2 border border-slate-200 rounded mt-1 outline-none"
                >
                  <option value="">[None - Root Level]</option>
                  {nodes.filter(n => n.id !== selectedNodeId).map(n => (
                    <option key={n.id} value={n.id}>{n.label}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleSaveEdit}
                className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded transition-all flex items-center justify-center gap-1"
              >
                <Check className="w-3.5 h-3.5" /> Apply Changes
              </button>
            </div>
          )}

          {/* VIEW CURRENT SELECTION */}
          {!isEditing && !isAdding && (
            selectedNode ? (
              <div className="bg-white p-3.5 rounded border border-slate-200 shadow-sm space-y-3">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{selectedNode.label}</h4>
                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 border text-slate-500 rounded mt-1 inline-block">
                    {selectedNode.parentId ? `Child of: ${nodes.find(n => n.id === selectedNode.parentId)?.label}` : "Main Chapter Concept (Root)"}
                  </span>
                </div>
                
                <p className="text-xs text-slate-600 leading-relaxed">
                  {selectedNode.description || "No deep description available. Click Edit to add details explaining this concept."}
                </p>

                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => startEdit(selectedNode)}
                    className="flex-1 py-1 px-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded flex items-center justify-center gap-1 transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteNode(selectedNode.id)}
                    className="py-1 px-2 border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded flex items-center justify-center gap-1 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-100/50 rounded p-6 text-center text-xs text-slate-500 border border-dashed">
                <p>Click on any concept node inside the mind map diagram to view or edit its educational details.</p>
              </div>
            )
          )}

          {/* AI VOICE PILOT CARD */}
          <div className="mt-5 pt-4 border-t border-slate-200">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                  AI Voice Pilot
                </span>
                {/* Language Toggle */}
                <button
                  type="button"
                  onClick={() => setSpeechLanguage(prev => prev === 'ar-SA' ? 'en-US' : 'ar-SA')}
                  className="px-2 py-0.5 bg-white border border-indigo-200 hover:border-indigo-300 text-indigo-700 text-[9px] font-bold rounded-full transition flex items-center gap-1"
                  title="Toggle speech recognition language"
                >
                  <Languages className="w-3 h-3" />
                  {speechLanguage === 'ar-SA' ? '🇸🇦 العربية' : '🇺🇸 English'}
                </button>
              </div>
              
              <p className="text-[10px] text-indigo-700 leading-snug">
                Speak or type a command to add, remove, or modify concept map nodes instantly.
              </p>

              {/* Voice recording button */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={isRecording ? stopSpeechRecognition : startSpeechRecognition}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    isRecording 
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-4 h-4 animate-bounce" /> Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" /> Record Voice
                    </>
                  )}
                </button>
                {voicePrompt.trim() && (
                  <button
                    type="button"
                    onClick={() => setVoicePrompt('')}
                    className="px-2 border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-lg text-xs"
                    title="Clear transcript"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Real-time speech transcript or typed instruction */}
              <div className="space-y-1">
                <textarea
                  placeholder={speechLanguage === 'ar-SA' ? 'مثال: أضف الجاذبية كابن لـ فيزياء' : 'e.g. Add acceleration under motion...'}
                  value={voicePrompt}
                  onChange={(e) => setVoicePrompt(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-indigo-100 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 resize-none min-h-[50px] leading-relaxed text-slate-800"
                />
              </div>

              {aiError && (
                <p className="text-[10px] font-medium text-rose-600 bg-rose-50 p-2 rounded border border-rose-100">
                  {aiError}
                </p>
              )}

              {/* Trigger AI modifications */}
              <button
                type="button"
                onClick={handleApplyAI}
                disabled={isProcessingAI || !voicePrompt.trim()}
                className="w-full py-2 bg-slate-900 hover:bg-slate-950 disabled:bg-slate-300 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                {isProcessingAI ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Updating Concept Map...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-indigo-300 fill-current" />
                    Modify Map with AI
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200/60 text-[10px] text-slate-400 flex items-center gap-1.5 leading-normal">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Nodes compute levels automatically and connect dynamically via interactive Bezier paths.</span>
        </div>
      </div>
    </div>
  );
}
