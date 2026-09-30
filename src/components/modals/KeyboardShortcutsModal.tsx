import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Shift + N', description: 'Open POS / New Order screen' },
    { key: 'Shift + S', description: 'Focus food search input bar' },
    { key: 'Shift + C', description: 'Jump to customer search input' },
    { key: 'Shift + W', description: 'Focus waiter selector' },
    { key: 'Shift + T', description: 'Focus table selector' },
    { key: 'F8', description: 'Print bill / receipt preview' },
    { key: 'F9', description: 'Place order / Send ticket to kitchen' },
    { key: 'F10', description: 'Open payment & settlement dialog' },
    { key: 'Shift + V', description: 'View current active running orders' },
    { key: 'Esc', description: 'Close any active dialog or modal' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100">POS Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto">
          {shortcuts.map((sc, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/80 text-xs"
            >
              <span className="text-slate-300 font-medium">{sc.description}</span>
              <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 font-mono text-[11px] font-bold text-amber-300 shadow-sm">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="p-3 bg-slate-950 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
