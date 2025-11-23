import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
const UIOverlay = ({ health, maxHealth, runes, maxRunes }) => {
    return (_jsxs("div", { className: "absolute top-4 left-4 pointer-events-none flex flex-col gap-2", children: [_jsx("div", { className: "flex gap-1", children: Array.from({ length: maxHealth }).map((_, i) => {
                    // Calculate fill percentage for this heart
                    const fill = Math.max(0, Math.min(1, health - i));
                    return (_jsxs("div", { className: "w-8 h-8 rounded-full border-2 border-slate-800 shadow-lg bg-slate-900/50 relative overflow-hidden", children: [_jsx("div", { className: "absolute top-0 left-0 h-full bg-white transition-all duration-300", style: { width: `${fill * 100}%` } }), fill > 0 && (_jsxs("div", { className: "absolute inset-0 flex items-center justify-center z-10", children: [_jsx("div", { className: "w-2 h-4 bg-black/20 rounded-full" }), _jsx("div", { className: "w-2 h-4 bg-black/20 rounded-full ml-1" })] }))] }, i));
                }) }), maxRunes > 0 && (_jsxs("div", { className: `flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border w-fit transition-colors duration-300 ${runes >= maxRunes ? 'border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'border-slate-700'}`, children: [_jsx("div", { className: `w-4 h-4 rotate-45 border-2 ${runes >= maxRunes ? 'bg-cyan-400 border-white' : 'border-slate-500'}` }), _jsxs("span", { className: `${runes >= maxRunes ? 'text-cyan-200' : 'text-slate-400'} font-serif text-sm`, children: ["Runes: ", runes, "/", maxRunes] })] })), _jsxs("div", { className: "mt-4 text-slate-500 text-xs font-mono opacity-50", children: ["A/D / Arrow Keys to Move", _jsx("br", {}), "Space / Up / W to Jump", _jsx("br", {}), "Shift / C to Dash", _jsx("br", {}), "Ctrl / X to Attack", _jsx("br", {}), "E to Interact"] })] }));
};
export default UIOverlay;
