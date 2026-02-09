const TypingIndicator = () => {
  return (
    <div className="flex gap-4 justify-start fade-in">
      {/* Avatar */}
      <div 
        className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-purple-sm ring-purple flex-shrink-0 overflow-hidden"
        style={{ 
          background: 'linear-gradient(135deg, #A594FF 0%, #667eea 100%)',
          backgroundImage: 'linear-gradient(135deg, #A594FF 0%, #667eea 100%)'
        }}
      >
        <img 
          src="https://gwjcgzeybqiyqezuswpt.supabase.co/storage/v1/object/public/profile-pictures/GRAZI.png" 
          alt="Grazi" 
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=Grazi&background=A594FF&color=fff&size=128"; }}
        />
      </div>

      {/* Typing Bubble */}
      <div className="rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm bg-slate-50 dark:bg-slate-700 border border-[rgba(165,148,255,0.2)] dark:border-[rgba(165,148,255,0.3)]">
        <div className="flex gap-1.5 items-center h-5">
          <span
            className="w-2 h-2 rounded-full bg-[#A594FF] animate-bounce-dots"
            style={{ animationDelay: "0s" }}
          />
          <span
            className="w-2 h-2 rounded-full bg-[#A594FF] animate-bounce-dots"
            style={{ animationDelay: "0.15s" }}
          />
          <span
            className="w-2 h-2 rounded-full bg-[#A594FF] animate-bounce-dots"
            style={{ animationDelay: "0.3s" }}
          />
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
