import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const ChatInput = ({ onSend, disabled, placeholder }: ChatInputProps) => {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [value]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex gap-3">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || "Digite sua mensagem..."}
        disabled={disabled}
        rows={1}
        className={cn(
          "flex-1 min-h-[70px] max-h-[150px] rounded-xl border-2",
          "border-[rgba(165,148,255,0.2)] dark:border-[rgba(165,148,255,0.3)]",
          "bg-white dark:bg-slate-800",
          "px-4 py-3 text-sm",
          "placeholder:text-slate-400 dark:placeholder:text-slate-500",
          "focus:border-[#A594FF] dark:focus:border-[#A594FF]",
          "focus:ring-2 focus:ring-[rgba(165,148,255,0.2)] dark:focus:ring-[rgba(165,148,255,0.3)]",
          "focus:bg-[rgba(165,148,255,0.02)] dark:focus:bg-[rgba(165,148,255,0.05)]",
          "focus:outline-none",
          "transition-all duration-300 resize-none",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        className={cn(
          "h-[70px] w-[70px] rounded-xl gradient-primary",
          "shadow-purple hover:shadow-purple-lg",
          "hover-lift",
          "flex items-center justify-center",
          "transition-all duration-300",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-purple disabled:hover:transform-none"
        )}
        style={{ 
          background: 'linear-gradient(135deg, #A594FF 0%, #667eea 100%)',
          backgroundImage: 'linear-gradient(135deg, #A594FF 0%, #667eea 100%)'
        }}
      >
        {disabled ? (
          <Loader2 className="w-5 h-5 text-white spinner" />
        ) : (
          <Send className="w-5 h-5 text-white" />
        )}
      </button>
    </div>
  );
};

export default ChatInput;
