import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import GameCanvas from './components/GameCanvas.js';
import UIOverlay from './components/UIOverlay.js';
import DialogueBox from './components/DialogueBox.js';
import { GameState } from './types.js';
const App = () => {
    const [gameState, setGameState] = useState(GameState.MENU);
    const [health, setHealth] = useState(5);
    const [interactionId, setInteractionId] = useState('');
    const [interactionType, setInteractionType] = useState('');
    // Lore / Key System
    const [collectedLore, setCollectedLore] = useState([]);
    const [runeCount, setRuneCount] = useState(0);
    const [maxRunes, setMaxRunes] = useState(0);
    const handleUpdateHealth = (hp) => {
        setHealth(hp);
        if (hp <= 0) {
            setGameState(GameState.GAME_OVER);
        }
    };
    const handleUpdateRunes = (current, max) => {
        setRuneCount(current);
        setMaxRunes(max);
    };
    const handleInteract = (id, type) => {
        setInteractionId(id);
        setInteractionType(type);
        // If it's a lore tablet, collect it
        if (type === 'lore_tablet') {
            if (!collectedLore.includes(id)) {
                setCollectedLore(prev => [...prev, id]);
            }
        }
    };
    const handleCloseDialogue = () => {
        setGameState(GameState.PLAYING);
    };
    const startGame = () => {
        setHealth(5);
        setCollectedLore([]); // Reset keys on new game
        setGameState(GameState.PLAYING);
    };
    const respawnGame = () => {
        setHealth(5);
        setCollectedLore([]); // Reset collected keys/lore on respawn
        setGameState(GameState.PLAYING);
    };
    return (_jsxs("div", { className: "relative w-screen h-screen bg-slate-950 overflow-hidden select-none font-sans", children: [_jsx("div", { className: `w-full h-full transition-opacity duration-1000 ${gameState === GameState.MENU ? 'opacity-30' : 'opacity-100'}`, children: _jsx(GameCanvas, { gameState: gameState, setGameState: setGameState, onUpdateHealth: handleUpdateHealth, onInteract: handleInteract, collectedLore: collectedLore, onUpdateRunes: handleUpdateRunes }) }), gameState === GameState.PLAYING || gameState === GameState.DIALOGUE ? (_jsx(UIOverlay, { health: health, maxHealth: 5, runes: runeCount, maxRunes: maxRunes })) : null, _jsx(DialogueBox, { isOpen: gameState === GameState.DIALOGUE, onClose: handleCloseDialogue, id: interactionId, type: interactionType }), gameState === GameState.MENU && (_jsx("div", { className: "absolute inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm", children: _jsxs("div", { className: "text-center animate-in fade-in zoom-in duration-500", children: [_jsx("h1", { className: "text-6xl md:text-8xl font-serif text-slate-200 mb-4 tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]", children: "VOID WALKER" }), _jsx("p", { className: "text-slate-400 text-xl mb-8 font-serif italic tracking-wide", children: "Echoes of the Forgotten Kingdom" }), _jsxs("button", { onClick: startGame, className: "group relative px-8 py-3 bg-transparent border border-slate-500 hover:border-white text-slate-300 hover:text-white transition-all duration-300 overflow-hidden", children: [_jsx("span", { className: "relative z-10 text-lg uppercase tracking-widest", children: "Enter the Void" }), _jsx("div", { className: "absolute inset-0 bg-slate-800 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" })] })] }) })), gameState === GameState.GAME_OVER && (_jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center z-50 bg-black/90", children: [_jsx("h2", { className: "text-6xl font-serif text-red-900 mb-6 tracking-widest uppercase drop-shadow-lg", children: "Vessel Broken" }), _jsxs("div", { className: "flex flex-col gap-4", children: [_jsx("button", { onClick: respawnGame, className: "px-6 py-2 bg-slate-800 border border-slate-600 hover:border-white text-slate-200 uppercase tracking-wider transition-all", children: "Try Again (Checkpoint)" }), _jsx("button", { onClick: () => setGameState(GameState.MENU), className: "text-slate-500 hover:text-white text-sm border-b border-transparent hover:border-white transition-colors pb-1", children: "Return to Menu" })] })] })), gameState === GameState.GAME_WON && (_jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center z-50 bg-violet-950/90 backdrop-blur-sm", children: [_jsx("h2", { className: "text-6xl font-serif text-amber-100 mb-2 tracking-widest uppercase drop-shadow-[0_0_25px_rgba(251,191,36,0.5)]", children: "Silence Restored" }), _jsx("p", { className: "text-violet-200 text-lg mb-8 font-serif italic", children: "The echo fades, and the void settles once more." }), _jsx("button", { onClick: () => setGameState(GameState.MENU), className: "px-6 py-2 border border-violet-400 text-violet-100 hover:bg-violet-900 transition-colors uppercase tracking-wider text-sm", children: "Ascend" })] })), _jsx("div", { className: "absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.8)] z-40" }), _jsx("div", { className: "absolute bottom-2 w-full text-center text-slate-600 text-xs font-mono pointer-events-none z-50 opacity-50", children: "Made by Shamik Shikhar Murmu" })] }));
};
export default App;
