import React from 'react';
import { Book, Clock, Layers, ArrowRight, Trash2 } from 'lucide-react';
import { Ebook } from '../types';

interface BookCoverProps {
  ebooks: Ebook[];
  onSelectBook: (id: string) => void;
  onDeleteBook: (id: string, e: React.MouseEvent) => void;
}

export default function BookCover({ ebooks, onSelectBook, onDeleteBook }: BookCoverProps) {
  
  const getSizeBadgeColor = (size: 'short' | 'medium' | 'long') => {
    switch (size) {
      case 'short':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'medium':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'long':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  const getReadTime = (chaptersCount: number) => {
    return `${chaptersCount * 8} mins read`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {ebooks.map((book) => (
        <div
          key={book.id}
          onClick={() => onSelectBook(book.id)}
          className="group cursor-pointer bg-white border border-gray-200 hover:border-indigo-400 hover:shadow-md rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between h-72"
        >
          {/* Aesthetic Book Header Spine */}
          <div className="bg-white px-5 py-4 text-gray-900 flex justify-between items-start relative overflow-hidden">
            <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 pointer-events-none">
              <Book className="w-24 h-24 stroke-[1.5]" />
            </div>
            
            <div className="space-y-1 z-10 min-w-0">
              <h3 className="font-bold text-sm tracking-tight truncate pr-6 group-hover:text-indigo-200 transition-colors">
                {book.title}
              </h3>
              <p className="text-[10px] text-gray-500 font-mono">
                {getReadTime(book.chapters.length)}
              </p>
            </div>

            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded z-10 shrink-0 ${getSizeBadgeColor(book.sizeCategory)}`}>
              {book.sizeCategory}
            </span>
          </div>

          {/* Book Details Body */}
          <div className="p-5 flex-1 flex flex-col justify-between">
            <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
              {book.description || "An immersive, AI-generated interactive ebook containing concept visualizations, audio narrator, and testing modules."}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-2 text-[11px] text-gray-400">
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-gray-400" />
                {book.chapters.length} chapters
              </span>
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                {new Date(book.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Quick Actions Footer */}
          <div className="px-5 py-3.5 bg-slate-50 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete '${book.title}'?`)) {
                  onDeleteBook(book.id, e);
                }
              }}
              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              title="Delete Ebook"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <span className="text-xs font-bold text-indigo-600 group-hover:text-indigo-800 flex items-center gap-1 transition-colors">
              Read Ebook
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>

        </div>
      ))}
    </div>
  );
}

