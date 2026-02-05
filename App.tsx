
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Plus, Save, Trash2, Calendar, ChevronLeft, ChevronRight, Hash, Moon, Star, Download, Upload } from 'lucide-react';
import { NoteEntry, TallyItem } from './types';
import { TallyMarks } from './components/TallyMarks';

const App: React.FC = () => {
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('notes_xd_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotes(parsed);
        if (parsed.length > 0) {
          setActiveNoteId(parsed[0].id);
        }
      } catch (e) {
        console.error("Failed to parse saved notes", e);
      }
    }
  }, []);

  const saveToLocalStorage = (updatedNotes: NoteEntry[]) => {
    localStorage.setItem('notes_xd_data', JSON.stringify(updatedNotes));
  };

  const createNewNote = () => {
    const newNote: NoteEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      title: 'Catatan Baru',
      items: [],
      lastModified: Date.now(),
    };
    const updated = [newNote, ...notes];
    setNotes(updated);
    setActiveNoteId(newNote.id);
    saveToLocalStorage(updated);
    // Close sidebar on small screens after creating a note
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const deleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Hapus catatan ini?")) {
      const updated = notes.filter(n => n.id !== id);
      setNotes(updated);
      if (activeNoteId === id) {
        setActiveNoteId(updated.length > 0 ? updated[0].id : null);
      }
      saveToLocalStorage(updated);
    }
  };

  const exportBackup = () => {
    const dataStr = JSON.stringify(notes, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ariev-xd-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          if (window.confirm("Muat data backup? Data saat ini akan diganti.")) {
            setNotes(json);
            if (json.length > 0) setActiveNoteId(json[0].id);
            saveToLocalStorage(json);
          }
        }
      } catch (err) { alert("Gagal membaca file."); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const updateActiveNote = useCallback((updater: (note: NoteEntry) => NoteEntry) => {
    setNotes(prev => {
      const updated = prev.map(n => n.id === activeNoteId ? updater(n) : n);
      saveToLocalStorage(updated);
      return updated;
    });
  }, [activeNoteId]);

  const activeNote = notes.find(n => n.id === activeNoteId);

  const totalCount = useMemo(() => {
    if (!activeNote) return 0;
    return activeNote.items.reduce((sum, item) => sum + item.count, 0);
  }, [activeNote]);

  const addItem = () => {
    if (!activeNoteId) return;
    updateActiveNote(note => ({
      ...note,
      lastModified: Date.now(),
      items: [...note.items, { id: Date.now().toString(), label: '', count: 0 }]
    }));
  };

  const updateItemLabel = (itemId: string, label: string) => {
    updateActiveNote(note => ({
      ...note,
      items: note.items.map(item => item.id === itemId ? { ...item, label } : item)
    }));
  };

  const incrementItem = (itemId: string) => {
    updateActiveNote(note => ({
      ...note,
      items: note.items.map(item => item.id === itemId ? { ...item, count: item.count + 1 } : item)
    }));
  };

  const decrementItem = (itemId: string) => {
    updateActiveNote(note => ({
      ...note,
      items: note.items.map(item => item.id === itemId ? { ...item, count: Math.max(0, item.count - 1) } : item)
    }));
  };

  const removeItem = (itemId: string) => {
    updateActiveNote(note => ({
      ...note,
      items: note.items.filter(item => item.id !== itemId)
    }));
  };

  return (
    <div className="flex h-screen bg-transparent text-gray-800 overflow-hidden relative">
      <input type="file" accept=".json" ref={fileInputRef} className="hidden" onChange={handleImport} />

      {/* Sidebar - Adjusted for Mobile Overlay if necessary */}
      <div className={`
        fixed inset-y-0 left-0 lg:relative z-40
        ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0'} 
        sidebar-night transition-all duration-300 flex flex-col overflow-hidden
      `}>
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon size={18} className="text-yellow-200 fill-yellow-200" />
            <h1 className="text-xl font-bold pencil-text text-white">Ariev XD</h1>
          </div>
          <button onClick={createNewNote} className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white active:scale-90 transition-transform">
            <Plus size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto sidebar-scroll p-2 space-y-2">
          {notes.length === 0 && (
            <div className="text-center p-8 text-white/30 italic text-sm">Belum ada catatan...</div>
          )}
          {notes.map(note => (
            <div
              key={note.id}
              onClick={() => { setActiveNoteId(note.id); if(window.innerWidth < 1024) setIsSidebarOpen(false); }}
              className={`
                p-3 rounded-lg cursor-pointer transition-all pencil-text border border-transparent
                ${activeNoteId === note.id ? 'sidebar-item-active text-white' : 'hover:bg-white/5 text-white/70'}
              `}
            >
              <div className="flex justify-between items-start">
                <div className="truncate font-semibold text-base">{note.title || 'Tanpa Judul'}</div>
                <button onClick={(e) => deleteNote(note.id, e)} className="text-red-400/50 hover:text-red-400 p-1">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="text-[10px] text-white/40 flex items-center gap-1 mt-1">
                <Calendar size={10} /> {note.date}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 grid grid-cols-2 gap-2 border-t border-white/10 mt-auto bg-black/20">
          <button onClick={exportBackup} className="flex items-center justify-center gap-1 py-2 text-[10px] bg-white/5 hover:bg-white/10 text-white rounded border border-white/10 transition-colors">
            <Download size={12} /> Backup
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-1 py-2 text-[10px] bg-white/5 hover:bg-white/10 text-white rounded border border-white/10 transition-colors">
            <Upload size={12} /> Reload
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col relative z-10 w-full min-w-0">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute left-0 top-6 z-50 bg-white/10 backdrop-blur-md shadow-md border border-white/20 p-2 rounded-r-lg text-white lg:hidden"
        >
          {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>

        {!activeNote ? (
          <div className="flex-1 flex flex-center items-center justify-center p-8 text-center flex-col space-y-4">
            <Star className="text-yellow-100 animate-pulse" size={40} />
            <div className="text-2xl pencil-text text-white/50 px-4">Ketuk '+' untuk mulai mencatat...</div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8 flex justify-center py-6 relative">
            {/* The Notebook Sheet - Highly optimized for Mobile */}
            <div className="notebook-paper w-full max-w-2xl min-h-fit h-max mb-10 rounded-xl shadow-2xl relative p-5 sm:p-8 md:p-12 border border-white/10">
              
              {/* Spiral/Rings - Smaller for mobile */}
              <div className="absolute left-3 top-0 bottom-0 w-6 notebook-rings opacity-30 hidden sm:block"></div>
              
              <header className="mb-6 border-b border-gray-800/20 pb-2 relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-end gap-2 justify-between">
                  <input
                    type="text"
                    value={activeNote.title}
                    onChange={(e) => updateActiveNote(n => ({...n, title: e.target.value}))}
                    className="bg-transparent border-none outline-none pencil-text text-2xl sm:text-3xl md:text-4xl font-bold w-full placeholder:text-gray-600/50"
                    placeholder="Judul..."
                  />
                  <div className="flex items-center gap-2 text-gray-800/70 text-sm">
                    <Calendar size={14} />
                    <input
                      type="date"
                      value={activeNote.date}
                      onChange={(e) => updateActiveNote(n => ({...n, date: e.target.value}))}
                      className="bg-transparent border-none outline-none pencil-text text-sm cursor-pointer"
                    />
                  </div>
                </div>
              </header>

              <div className="space-y-1.5 relative z-10">
                {activeNote.items.map((item) => (
                  <div key={item.id} className="group flex flex-col sm:flex-row sm:items-center gap-2 relative border-b border-gray-800/5 sm:border-none pb-2 sm:pb-0">
                    <div className="flex-1 flex items-center gap-2 pl-6 sm:pl-8">
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => updateItemLabel(item.id, e.target.value)}
                        placeholder="Item..."
                        className="bg-transparent border-b border-gray-800/10 outline-none pencil-text text-xl sm:text-2xl w-full flex-1 py-0.5 focus:border-emerald-800"
                      />
                      <span className="pencil-text text-lg sm:text-xl font-bold text-emerald-950 min-w-[24px] text-center">{item.count}</span>
                    </div>

                    <div 
                      className="flex items-center gap-2 flex-1 bg-black/5 rounded-lg p-1.5 min-h-[44px] cursor-pointer hover:bg-black/10 transition-colors ml-6 sm:ml-0" 
                      onClick={() => incrementItem(item.id)}
                    >
                      <TallyMarks count={item.count} />
                    </div>

                    <div className="flex items-center gap-1 justify-end opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); decrementItem(item.id); }}
                        className="p-1.5 bg-white/40 rounded-md hover:bg-white text-gray-800 border border-black/5"
                      >
                        <span className="text-xs px-1">-1</span>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                        className="p-1.5 bg-red-100/40 rounded-md hover:bg-red-100 text-red-700 border border-red-200/30"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Total Count - Condensed for mobile */}
                {activeNote.items.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-800/20 flex justify-between items-center px-2">
                    <div className="pencil-text text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 pl-6 sm:pl-8">Total</div>
                    <div className="flex flex-col items-end">
                      <div className="pencil-text text-2xl sm:text-4xl font-bold text-emerald-950 leading-none mb-1">{totalCount}</div>
                      <div className="scale-75 origin-right">
                        <TallyMarks count={totalCount} />
                      </div>
                    </div>
                  </div>
                )}

                <button 
                  onClick={addItem}
                  className="w-full py-3 border-2 border-dashed border-gray-600/20 rounded-xl flex items-center justify-center gap-2 pencil-text text-lg text-gray-700 hover:border-emerald-800 hover:text-emerald-900 transition-all hover:bg-emerald-100/10 mt-4 active:scale-98"
                >
                  <Plus size={20} /> Tambah Item
                </button>
              </div>

              <div className="mt-10 pt-6 border-t border-gray-800/5 text-center relative z-10">
                <div className="pencil-text text-gray-600/60 italic text-xs flex items-center justify-center gap-2">
                   Ariev XD - Simpan Otomatis
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Save Button Mobile - Only if sidebar closed and note active */}
      {!isSidebarOpen && activeNote && (
        <button 
          onClick={() => saveToLocalStorage(notes)}
          className="fixed bottom-6 right-6 p-4 bg-emerald-700 text-white rounded-full shadow-xl active:scale-90 transition-all md:hidden z-50 border border-white/20"
        >
          <Save size={24} />
        </button>
      )}
    </div>
  );
};

export default App;
