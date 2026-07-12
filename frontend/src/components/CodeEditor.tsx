import React, { useRef, useEffect } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { Terminal, Code2, Sparkles } from "lucide-react";

interface CodeEditorProps {
  code: string;
  language: string;
  onChange: (value: string | undefined) => void;
  readOnly?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  language,
  onChange,
  readOnly = false,
}) => {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Microsoft Edge Fix: Permanently disable Edge's built-in "Microsoft Editor" writing assistant,
    // spellcheck, autocorrect, and autocapitalize on Monaco's hidden input textarea so Edge never
    // intercepts Backspace, text selection deletion, or clipboard copy/paste operations.
    const disableEdgeInterception = () => {
      const domNode = editor.getDomNode();
      if (!domNode) return;
      const textareas = domNode.querySelectorAll("textarea");
      textareas.forEach((ta) => {
        ta.setAttribute("spellcheck", "false");
        ta.setAttribute("autocorrect", "off");
        ta.setAttribute("autocapitalize", "off");
        ta.setAttribute("data-gramm", "false");
        ta.setAttribute("data-ms-editor", "false");
        ta.setAttribute("data-enable-grammarly", "false");
        ta.style.outline = "none";
      });
    };

    disableEdgeInterception();

    // Use a MutationObserver to ensure any dynamically created textareas by Monaco stay sanitized against Edge
    const domNode = editor.getDomNode();
    if (domNode) {
      const observer = new MutationObserver(() => disableEdgeInterception());
      observer.observe(domNode, { childList: true, subtree: true });
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-800 transition-all duration-300">
      {/* Sleek Terminal Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur text-xs font-mono text-slate-400 select-none">
        <div className="flex items-center space-x-3">
          <div className="flex space-x-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-700/80 transition-colors hover:bg-rose-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-slate-700/80 transition-colors hover:bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-slate-700/80 transition-colors hover:bg-emerald-500/80" />
          </div>
          <span className="text-slate-500">|</span>
          <div className="flex items-center space-x-1.5 text-slate-300 font-medium">
            <Terminal className="w-3.5 h-3.5 text-slate-400" />
            <span>workspace.{language === "python3" ? "py" : language === "cpp" ? "cpp" : "go"}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 text-[11px] uppercase tracking-wider">
            <Code2 className="w-3 h-3 mr-1 text-slate-400" />
            {language}
          </span>
          <span className="flex items-center text-[11px] text-amber-500/90 font-sans tracking-tight">
            <Sparkles className="w-3 h-3 mr-1 animate-pulse" />
            Executor Ready
          </span>
        </div>
      </div>

      {/* Editor Container */}
      <div className="flex-1 w-full relative pt-2 overflow-hidden">
        <Editor
          height="100%"
          language={language === "python3" ? "python" : language}
          value={code}
          onMount={handleEditorDidMount}
          onChange={(val) => onChange(val)}
          theme="vs-dark"
          options={{
            readOnly,
            automaticLayout: true,
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
            fontLigatures: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            padding: { top: 12, bottom: 12 },
            lineNumbersMinChars: 3,
            renderLineHighlight: "all",
            smoothScrolling: true,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
            contextmenu: true,
            selectOnLineNumbers: true,
            roundedSelection: true,
            autoIndent: "full",
            formatOnPaste: false,
            formatOnType: false,
            trimAutoWhitespace: false,
            tabSize: 4,
            insertSpaces: true,
            dragAndDrop: true,
            multiCursorModifier: "alt",
            accessibilitySupport: "off",
            autoClosingBrackets: "always",
            autoClosingQuotes: "always",
            autoSurround: "languageDefined",
          }}
        />
      </div>
    </div>
  );
};
