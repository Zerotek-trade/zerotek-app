export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div className="noise-overlay" />
      <div className="relative flex flex-col items-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl bg-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute -inset-6 rounded-3xl border border-primary/20 animate-pulse" style={{ animationDuration: '2.5s' }} />
          <div className="absolute -inset-12 rounded-[2rem] border border-primary/10 animate-pulse" style={{ animationDuration: '3s' }} />
          
          <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center animate-float border border-primary/20">
            <svg viewBox="0 0 40 40" className="h-10 w-10 text-primary">
              <path 
                d="M8 8 L20 8 L20 12 L12 12 L12 28 L8 28 Z" 
                fill="currentColor" 
                className="animate-draw"
              />
              <path 
                d="M22 8 L32 8 L32 12 L26 12 L26 16 L30 16 L30 20 L26 20 L26 24 L32 24 L32 28 L22 28 Z" 
                fill="currentColor" 
                className="animate-draw"
                style={{ animationDelay: '0.1s' }}
              />
              <circle 
                cx="27" cy="34" r="3" 
                fill="currentColor" 
                className="animate-pulse"
              />
            </svg>
          </div>
        </div>
        
        <div className="mt-10 flex flex-col items-center gap-4">
          <div className="flex gap-1.5">
            <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-sm text-muted-foreground">loading...</p>
        </div>
      </div>
      
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-6px) scale(1.02); }
        }
        .animate-float {
          animation: float 2s ease-in-out infinite;
        }
        @keyframes draw {
          0% { opacity: 0.3; }
          50% { opacity: 1; }
          100% { opacity: 0.3; }
        }
        .animate-draw {
          animation: draw 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
