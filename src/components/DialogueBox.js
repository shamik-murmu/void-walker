import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { getLore } from '../utils/lore.js';
const DialogueBox = ({ isOpen, onClose, id, type }) => {
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);
    const [displayedText, setDisplayedText] = useState("");
    // Fetch text when opened
    useEffect(() => {
        if (isOpen) {
            setDisplayedText("");
            setText(getLore(id));
        }
    }, [isOpen, id]);
    // Typewriter effect
    useEffect(() => {
        if (!loading && text) {
            let i = 0;
            const interval = setInterval(() => {
                setDisplayedText(text.slice(0, i + 1));
                i++;
                if (i >= text.length)
                    clearInterval(interval);
            }, 30); // speed
            return () => clearInterval(interval);
        }
    }, [loading, text]);
    // Listen for Enter / Escape to close
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen)
                return;
            if (e.key === 'Enter' || e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "absolute inset-0 bg-black/60 flex items-end justify-center pb-20 z-50", children: _jsxs("div", { className: "w-full max-w-2xl mx-4 bg-slate-900 border-2 border-slate-700 rounded-lg p-6 shadow-2xl relative", children: [_jsx("div", { className: "absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-slate-400" }), _jsx("div", { className: "absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2 border-slate-400" }), _jsx("div", { className: "absolute -bottom-3 -left-3 w-6 h-6 border-b-2 border-l-2 border-slate-400" }), _jsx("div", { className: "absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-slate-400" }), _jsx("h3", { className: "text-slate-400 font-serif text-sm uppercase tracking-widest mb-2 border-b border-slate-800 pb-1", children: type === 'lore_tablet' ? 'Ancient Inscription' : 'Whisper' }), _jsx("div", { className: "min-h-[60px] flex items-center", children: _jsx("p", { className: "text-slate-200 font-serif text-lg leading-relaxed", children: displayedText ? `"${displayedText}"` : '' }) }), _jsxs("div", { className: "mt-4 flex justify-end items-center gap-4", children: [_jsx("span", { className: "text-xs text-slate-600 font-mono uppercase tracking-wider hidden sm:inline-block", children: "[Enter] to Close" }), _jsx("button", { onClick: onClose, className: "px-4 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded transition-colors border border-slate-700", children: "Close" })] })] }) }));
};
export default DialogueBox;
