import React, { useState, useEffect } from 'react';
import { Question } from '../types';

interface QuizModalProps {
  questions: Question[];
  onComplete: (success: boolean, questionsConsumed: number) => void;
  onClose: () => void;
}

const QuizModal: React.FC<QuizModalProps> = ({ questions, onComplete, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [wrongChoice, setWrongChoice] = useState<string | null>(null);
  const [isCorrectState, setIsCorrectState] = useState(false);
  const [animatingOut, setAnimatingOut] = useState(false);

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    // If we ran out of questions without getting one right
    if (!currentQuestion && currentIndex > 0) {
      // Failed all available questions
      onComplete(false, currentIndex); 
    }
  }, [currentQuestion, currentIndex, onComplete]);

  const handleAnswer = (option: string) => {
    if (isCorrectState || wrongChoice || animatingOut) return;

    const isCorrect = option === currentQuestion.correctAnswer;
    
    if (isCorrect) {
      setIsCorrectState(true);
      
      // Celebrate and finish
      setTimeout(() => {
        onComplete(true, currentIndex + 1);
      }, 1000);

    } else {
      // Wrong answer logic:
      setWrongChoice(option);
      
      // Wait a brief moment to show red, then move to next question
      setTimeout(() => {
        setAnimatingOut(true);
        setTimeout(() => {
          setWrongChoice(null);
          setAnimatingOut(false);
          setCurrentIndex(prev => prev + 1);
        }, 300);
      }, 800);
    }
  };

  if (!currentQuestion) return null;

  return (
    <div className="absolute inset-0 bg-[#fffdf5] z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b-2 border-black bg-white flex justify-between items-center">
        <div className="font-bold text-sm text-gray-500">SURVIVAL MODE</div>
        <div className="font-black bg-red-500 text-white px-2 py-1 text-xs rounded border border-black">
          {questions.length - currentIndex} Left
        </div>
      </div>
      
      {/* Question Card */}
      <div className={`flex-1 flex flex-col justify-center p-6 max-w-md mx-auto w-full transition-opacity duration-300 ${animatingOut ? 'opacity-0 translate-x-[-20px]' : 'opacity-100 translate-x-0'}`}>
         <div className="mb-8">
           <h2 className="text-2xl font-bold leading-tight border-l-8 border-[#FFD028] pl-6 py-2">
             {currentQuestion.question}
           </h2>
         </div>

         <div className="space-y-4">
           {currentQuestion.options.map((opt, idx) => {
             let stateClass = "bg-white border-black text-black hover:bg-gray-50";
             
             if (isCorrectState && opt === currentQuestion.correctAnswer) {
                stateClass = "bg-green-400 border-black text-black scale-105";
             } else if (wrongChoice === opt) {
                stateClass = "bg-red-400 border-black text-black animate-shake";
             }

             return (
               <button 
                 key={idx}
                 onClick={() => handleAnswer(opt)}
                 disabled={isCorrectState || wrongChoice !== null}
                 className={`w-full p-5 rounded-xl text-left font-bold border-2 text-lg shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all active:translate-y-[2px] active:shadow-[2px_2px_0_0_rgba(0,0,0,1)] ${stateClass}`}
               >
                 {opt}
               </button>
             );
           })}
         </div>
         
         {wrongChoice && (
           <div className="mt-6 text-center font-bold text-red-500 animate-pulse">
             WRONG! NEXT QUESTION INCOMING...
           </div>
         )}
      </div>
    </div>
  );
};

export default QuizModal;