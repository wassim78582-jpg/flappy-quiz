
import React, { useState, useEffect, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import QuizModal from './components/QuizModal';
import { generateQuizFromNotes } from './services/geminiService';
import { NoteData, PlayerState, Question, SkinId } from './types';
import { SKINS } from './constants';

// Icons (Simple SVGs)
const Icons = {
  Home: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  Book: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  Play: () => <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>,
  Plus: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>,
  Close: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
};

// Initial State
const INITIAL_STATE: PlayerState = {
  currentSkin: SkinId.DEFAULT,
  highScore: 0,
  xp: 0,
  level: 1
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'HOME' | 'NOTES'>('HOME');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerState, setPlayerState] = useState<PlayerState>(() => {
    const saved = localStorage.getItem('flappyPlayer');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        currentSkin: SkinId.DEFAULT, // Always reset to default since we removed others
        highScore: parsed.highScore || 0,
        xp: parsed.xp || 0,
        level: parsed.level || 1
      };
    }
    return INITIAL_STATE;
  });
  
  const [notes, setNotes] = useState<string>("");
  const [noteHistory, setNoteHistory] = useState<NoteData[]>([]);
  const [quizQueue, setQuizQueue] = useState<Question[]>([]);
  const [isProcessingNotes, setIsProcessingNotes] = useState(false);
  
  // Modals
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);

  useEffect(() => {
    localStorage.setItem('flappyPlayer', JSON.stringify(playerState));
  }, [playerState]);

  const handleStartGame = () => {
    setIsPlaying(true);
    setCurrentScore(0);
  };

  const handleCrash = useCallback(() => {
    setIsPlaying(false);
    if (quizQueue.length > 0) {
      setShowQuiz(true);
    } else {
      // No questions? Just save score
      setPlayerState(prev => ({
        ...prev,
        highScore: Math.max(prev.highScore, currentScore)
      }));
    }
  }, [quizQueue, currentScore]);

  const handleQuizComplete = (success: boolean, questionsConsumed: number) => {
    // Survival mode logic: Just continue, no coins.
    const newXp = success ? playerState.xp + 10 : playerState.xp;
    const newLevel = Math.floor(newXp / 100) + 1;

    setPlayerState(prev => ({
      ...prev,
      xp: newXp,
      level: newLevel,
      highScore: Math.max(prev.highScore, currentScore)
    }));
    
    // Remove consumed questions from queue
    setQuizQueue(prev => prev.slice(questionsConsumed));
    setShowQuiz(false);
  };

  const handleGenerateNotes = async () => {
    if (!notes.trim()) return;
    setIsProcessingNotes(true);
    try {
      const result = await generateQuizFromNotes(notes);
      const newNote: NoteData = {
        id: Date.now().toString(),
        content: notes,
        summary: result.summary,
        timestamp: Date.now()
      };
      setNoteHistory(prev => [newNote, ...prev]);
      setQuizQueue(prev => [...prev, ...result.questions]);
      setNotes("");
      setShowNoteInput(false);
      setActiveTab('HOME');
    } catch (e) {
      console.error(e);
      alert("AI Processing Failed. Try again.");
    } finally {
      setIsProcessingNotes(false);
    }
  };

  // --- UI Components ---

  const Button = ({ children, onClick, className = "", disabled = false, variant = "primary" }: any) => {
    const baseStyle = "font-bold border-2 border-black rounded-xl px-6 py-3 transition-all active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed";
    const variants: Record<string, string> = {
      primary: "bg-black text-white shadow-[4px_4px_0_0_rgba(0,0,0,0.2)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.2)]",
      secondary: "bg-white text-black shadow-[4px_4px_0_0_#000] hover:shadow-[6px_6px_0_0_#000]",
      danger: "bg-red-500 text-white border-red-900 shadow-[4px_4px_0_0_#500] hover:shadow-[6px_6px_0_0_#500]",
    };
    
    return (
      <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
        {children}
      </button>
    );
  };

  const Card = ({ children, className = "" }: any) => (
    <div className={`bg-white border-2 border-black rounded-xl shadow-[4px_4px_0_0_#000] p-4 ${className}`}>
      {children}
    </div>
  );

  // --- Sections ---

  const renderHome = () => {
    return (
      <div className="flex flex-col h-full items-center justify-center p-6 space-y-8 relative">
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-black tracking-tighter uppercase">Flappy<br/>Quiz</h1>
          <p className="font-medium text-gray-600">Fly. Crash. Learn.</p>
        </div>

        <div className="relative group cursor-pointer" onClick={handleStartGame}>
           <div className="absolute inset-0 bg-black rounded-full translate-y-2 translate-x-2 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform"></div>
           <button className="relative w-48 h-48 bg-[#FFD028] border-4 border-black rounded-full flex flex-col items-center justify-center transition-transform active:scale-95">
              <Icons.Play />
              <span className="font-black text-2xl mt-2">PLAY</span>
              {quizQueue.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full border-2 border-black -rotate-12">
                  {quizQueue.length} Qs Ready
                </span>
              )}
           </button>
        </div>

        {/* Stats */}
        <div className="w-full max-w-sm space-y-4">
          <Card className="flex items-center justify-between px-6 py-4">
             <div className="flex flex-col">
                <span className="text-xs font-bold uppercase text-gray-400">High Score</span>
                <span className="text-3xl font-black">{playerState.highScore}</span>
             </div>
             <div className="h-10 w-[1px] bg-gray-200 mx-4"></div>
             <div className="flex flex-col items-end">
                <span className="text-xs font-bold uppercase text-gray-400">Level</span>
                <span className="text-3xl font-black">{playerState.level}</span>
             </div>
          </Card>
        </div>

        {/* Credit */}
        <div className="absolute bottom-6 text-xs font-bold text-gray-400 uppercase tracking-widest">
           Made by Wassim Benrabia
        </div>
      </div>
    );
  };

  const renderNotes = () => (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-black uppercase">My Notes</h2>
        <Button variant="secondary" className="!px-3 !py-2 !rounded-lg" onClick={() => setShowNoteInput(true)}>
           <Icons.Plus />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pb-20">
        {noteHistory.length === 0 ? (
          <div className="h-64 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400">
            <Icons.Book />
            <p className="mt-2 font-bold">No notes yet.</p>
          </div>
        ) : (
          noteHistory.map((note) => (
            <Card key={note.id} className="cursor-pointer hover:bg-gray-50">
              <div className="flex justify-between items-start">
                 <h3 className="font-bold text-lg leading-tight mb-2 line-clamp-2">{note.summary}</h3>
                 <span className="text-[10px] font-bold bg-black text-white px-2 py-1 rounded border border-black">{new Date(note.timestamp).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-gray-500 line-clamp-2">{note.content}</p>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#fffdf5] text-black overflow-hidden flex flex-col">
      
      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        {activeTab === 'HOME' && renderHome()}
        {activeTab === 'NOTES' && renderNotes()}
      </main>

      {/* Bottom Dock Navigation */}
      <nav className="h-20 border-t-2 border-black bg-white flex items-center justify-around px-4 pb-safe z-40">
        {[
          { id: 'HOME', icon: Icons.Home, label: 'Home' },
          { id: 'NOTES', icon: Icons.Book, label: 'Notes' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-center justify-center w-20 h-full transition-all ${activeTab === tab.id ? 'translate-y-[-4px] text-black' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <tab.icon />
            {activeTab === tab.id && <div className="h-1.5 w-1.5 bg-black rounded-full mt-1" />}
          </button>
        ))}
      </nav>

      {/* Full Screen Overlays */}
      
      {/* 1. Game Overlay */}
      {isPlaying && (
        <div className="absolute inset-0 z-50 bg-sky-300">
           <GameCanvas 
             skinId={playerState.currentSkin} 
             onCrash={handleCrash} 
             isActive={isPlaying} 
             onScore={setCurrentScore} 
           />
           <button 
             onClick={() => setIsPlaying(false)}
             className="absolute top-4 right-4 z-[60] bg-white border-2 border-black px-3 py-1 rounded font-bold shadow-[2px_2px_0_0_#000]"
           >
             EXIT
           </button>
        </div>
      )}

      {/* 2. Note Input Modal */}
      {showNoteInput && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
           <div className="bg-white border-2 border-black rounded-xl shadow-[8px_8px_0_0_#000] w-full max-w-md flex flex-col overflow-hidden max-h-[80vh] animate-in fade-in slide-in-from-bottom-10">
              <div className="p-4 border-b-2 border-black flex justify-between items-center bg-gray-50">
                 <h3 className="font-bold text-lg">New Notes</h3>
                 <button onClick={() => setShowNoteInput(false)}><Icons.Close /></button>
              </div>
              <textarea 
                className="flex-1 p-4 resize-none outline-none font-medium min-h-[200px]"
                placeholder="Paste your study material here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div className="p-4 border-t-2 border-black bg-gray-50">
                <Button 
                   onClick={handleGenerateNotes} 
                   disabled={isProcessingNotes || !notes.trim()}
                   className="w-full flex justify-center"
                >
                   {isProcessingNotes ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"/> : "Generate Quiz"}
                </Button>
              </div>
           </div>
        </div>
      )}

      {/* 3. Quiz Modal */}
      {showQuiz && (
        <QuizModal 
          questions={quizQueue} 
          onComplete={handleQuizComplete}
          onClose={() => setShowQuiz(false)}
        />
      )}

    </div>
  );
};

export default App;