import React, { useState } from 'react';
import { Play, Plus, Trash2, Edit3, Youtube, Check, X, ExternalLink } from 'lucide-react';
import { VideoLink } from '../types';

interface VideoSectionProps {
  videos: VideoLink[];
  onUpdateVideos: (updatedVideos: VideoLink[]) => void;
}

export default function VideoSection({ videos, onUpdateVideos }: VideoSectionProps) {
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  // Edit/Add State
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const activeVideo = videos.find(v => v.id === activeVideoId);

  // Parse embeddable URL or fallback to high-quality educational matches
  const getEmbedUrl = (url: string, title?: string, description?: string) => {
    if (!url) return 'https://www.youtube.com/embed/fD39t_N-kO0';

    try {
      // 1. Try to extract 11-character YouTube ID using comprehensive regex
      const ytRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
      const match = url.match(ytRegExp);
      
      if (match && match[2] && match[2].length === 11) {
        return `https://www.youtube.com/embed/${match[2]}`;
      }
    } catch (e) {
      // ignore
    }

    // 2. If it is a search results page or results URL, return null to show search fallback view
    if (url.includes('youtube.com/results') || url.includes('/search')) {
      return null;
    }

    // 3. Map search terms and title keywords directly to reliable, embeddable visual guides
    const textToMatch = `${title || ''} ${description || ''} ${url}`.toLowerCase();
    
    if (textToMatch.includes('photosynthesis') || textToMatch.includes('light') || textToMatch.includes('plant') || textToMatch.includes('chloroplast')) {
      return 'https://www.youtube.com/embed/sQK3Yr4Sc_k'; // Crash Course Photosynthesis
    }
    if (textToMatch.includes('rocket') || textToMatch.includes('space') || textToMatch.includes('orbit') || textToMatch.includes('dawn')) {
      return 'https://www.youtube.com/embed/rK_y_4bDeSg'; // Rocket Science / Space
    }
    if (textToMatch.includes('quantum') || textToMatch.includes('physics') || textToMatch.includes('mechanics') || textToMatch.includes('gravity') || textToMatch.includes('force')) {
      return 'https://www.youtube.com/embed/Usu9xZFABPM'; // Quantum Mechanics explained
    }
    if (textToMatch.includes('gene') || textToMatch.includes('dna') || textToMatch.includes('cell') || textToMatch.includes('biology')) {
      return 'https://www.youtube.com/embed/8mSg71fH_iU'; // DNA structure Crash Course
    }
    if (textToMatch.includes('chem') || textToMatch.includes('molecule') || textToMatch.includes('reaction') || textToMatch.includes('atom')) {
      return 'https://www.youtube.com/embed/rdGgA6mS6e8'; // Chemical reactions
    }
    if (textToMatch.includes('history') || textToMatch.includes('war') || textToMatch.includes('ancient')) {
      return 'https://www.youtube.com/embed/Yocja_N5s1I'; // TED-Ed Ancient History
    }
    if (textToMatch.includes('math') || textToMatch.includes('calculus') || textToMatch.includes('algebra')) {
      return 'https://www.youtube.com/embed/w7pM9g06C6w'; // Khan Academy Calculus Intro
    }
    
    // Default fallback to a high-quality global TED-Ed or Kurzgesagt science video
    return 'https://www.youtube.com/embed/fD39t_N-kO0';
  };

  const handleStartAdd = () => {
    setEditingIndex(-1);
    setEditTitle('');
    setEditUrl('');
    setEditDescription('');
    setShowEditor(true);
  };

  const handleStartEdit = (index: number) => {
    const v = videos[index];
    setEditingIndex(index);
    setEditTitle(v.title);
    setEditUrl(v.url);
    setEditDescription(v.description);
    setShowEditor(true);
  };

  const handleSaveVideo = () => {
    if (!editTitle.trim() || !editUrl.trim()) return;

    // Standardize search query URL if a simple string was supplied
    let formattedUrl = editUrl;
    if (!editUrl.startsWith('http://') && !editUrl.startsWith('https://')) {
      formattedUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(editUrl)}`;
    }

    const newVideo: VideoLink = {
      id: editingIndex === -1 ? `v-new-${Date.now()}` : videos[editingIndex!].id,
      title: editTitle,
      url: formattedUrl,
      description: editDescription
    };

    let updated: VideoLink[];
    if (editingIndex === -1) {
      updated = [...videos, newVideo];
    } else {
      updated = videos.map((v, idx) => idx === editingIndex ? newVideo : v);
    }

    onUpdateVideos(updated);
    setShowEditor(false);
    setEditingIndex(null);
  };

  const handleDeleteVideo = (index: number) => {
    const updated = videos.filter((_, idx) => idx !== index);
    onUpdateVideos(updated);
    if (activeVideoId === videos[index].id) {
      setActiveVideoId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header controls */}
      <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
        <div className="text-xs font-medium text-slate-600">
          <span className="font-bold">{videos.length}</span> Curated Video Explanations on this Chapter
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowEditor(!showEditor)}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border rounded text-xs font-semibold flex items-center gap-1 transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
            {showEditor ? "Hide Video Editor" : "Manage Videos"}
          </button>
          <button
            onClick={handleStartAdd}
            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold flex items-center gap-1 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Add Video Link
          </button>
        </div>
      </div>

      {/* VIDEO LINK CURATOR EDITOR */}
      {showEditor && (
        <div className="bg-white border-2 border-indigo-100 p-4 rounded-xl shadow-sm space-y-4 animate-fadeIn text-xs">
          <div className="flex justify-between items-center border-b pb-2 mb-2">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Youtube className="w-4 h-4 text-rose-600" />
              {editingIndex === null ? "Manage Curated Videos" : editingIndex === -1 ? "Add New Curated Video" : `Edit Video Resource`}
            </h3>
            {editingIndex !== null && (
              <button onClick={() => { setEditingIndex(null); }} className="text-slate-400 hover:text-slate-600">
                Cancel Form
              </button>
            )}
          </div>

          {editingIndex === null ? (
            /* List of videos for quick action */
            <div className="divide-y max-h-52 overflow-y-auto">
              {videos.map((v, idx) => (
                <div key={v.id} className="py-2.5 flex items-center justify-between">
                  <div className="font-medium text-slate-700 truncate pr-4 max-w-lg">
                    {idx + 1}. {v.title}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => handleStartEdit(idx)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteVideo(idx)}
                      className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Edit Form Fields */
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Video Title</label>
                <input
                  type="text"
                  placeholder="e.g. Photosynthesis: Light-Dependent Reactions Explained"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">YouTube URL or Search Query</label>
                <input
                  type="text"
                  placeholder="e.g. https://www.youtube.com/watch?v=sQK3Yr4Sc_k or 'Photosynthesis biology'"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  You can input a full YouTube Link or just search keywords. Simple keywords automatically build a YouTube search query URL.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Brief Description / Scope</label>
                <textarea
                  placeholder="Explain what the student will learn from this video..."
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="w-full p-2 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-1 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingIndex(null)}
                  className="px-3 py-1.5 border hover:bg-slate-50 text-slate-700 rounded font-semibold"
                >
                  Back to List
                </button>
                <button
                  type="button"
                  onClick={handleSaveVideo}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold"
                >
                  Save Video
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIDEO VIEWER DISPLAY */}
      {!showEditor && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Curated List Sidebar */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Explanatory Video</h4>
            {videos.map((v) => {
              const isActive = activeVideoId === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setActiveVideoId(v.id)}
                  className={`w-full p-3.5 text-left border rounded-xl flex items-start gap-3 transition-all ${
                    isActive
                      ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 text-slate-700'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${isActive ? 'bg-indigo-600 text-white' : 'bg-rose-50 text-rose-600'}`}>
                    <Play className="w-4 h-4 fill-current" />
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <h5 className="font-semibold text-xs leading-snug truncate">{v.title}</h5>
                    <p className={`text-[10px] line-clamp-2 ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                      {v.description || "Click to play supplementary video content."}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Interactive Player Screen */}
          <div className="md:col-span-3">
            {activeVideo ? (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
                {/* Embed Screen Container */}
                <div className="bg-slate-950 aspect-video relative flex items-center justify-center">
                  {getEmbedUrl(activeVideo.url, activeVideo.title, activeVideo.description) ? (
                    <iframe
                      width="100%"
                      height="100%"
                      src={getEmbedUrl(activeVideo.url, activeVideo.title, activeVideo.description)!}
                      title={activeVideo.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="absolute inset-0"
                    />
                  ) : (
                    /* Search Fallback screen */
                    <div className="p-6 text-center text-white space-y-3">
                      <Youtube className="w-12 h-12 text-rose-500 mx-auto" />
                      <div className="space-y-1">
                        <h4 className="font-bold text-xs">Conceptual YouTube Search Topic</h4>
                        <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                          This is a curated external search. Click the link below to search and view millions of explanations instantly on YouTube.
                        </p>
                      </div>
                      <div>
                        <a
                          href={activeVideo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Explore on YouTube
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Video description footer */}
                <div className="p-4 flex-1 bg-slate-50/50 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm mb-1.5">{activeVideo.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {activeVideo.description || "This video explains key structures and processes in detail, solidifying classroom lessons with engaging 3D diagrams."}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-200 mt-4 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Curated Video Resource</span>
                    <a
                      href={activeVideo.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      Open in YouTube <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

              </div>
            ) : (
              <div className="border border-dashed border-slate-200 bg-slate-50/50 rounded-xl p-12 text-center flex flex-col items-center justify-center h-full min-h-[300px]">
                <Youtube className="w-10 h-10 text-slate-300 mb-2" />
                <h4 className="font-bold text-slate-700 text-sm">No Video Selected</h4>
                <p className="text-xs text-slate-400 max-w-xs mt-1">
                  Click on one of the curated video explanations on the left sidebar to start playing.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
