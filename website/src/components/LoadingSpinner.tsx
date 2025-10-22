import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
  progress?: number;
  className?: string;
}

const LoadingSpinner = ({ message = "Processing...", progress, className = "" }: LoadingSpinnerProps) => {
  return (
    <div className={`flex flex-col items-center space-y-6 ${className}`}>
      {/* Animated spinner */}
      <div className="relative">
        <div className="w-16 h-16 border-4 border-border rounded-full"></div>
        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
        <Loader2 className="absolute inset-0 w-16 h-16 text-primary/30 animate-spin" />
      </div>

      {/* Progress bar */}
      {progress !== undefined && (
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{message}</span>
            <span className="text-primary font-mono">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="progress-neon h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Simple message */}
      {progress === undefined && (
        <div className="text-center space-y-2">
          <p className="text-lg font-medium">{message}</p>
          <p className="text-sm text-muted-foreground">
            This may take a few moments...
          </p>
        </div>
      )}

      {/* Floating dots animation */}
      <div className="flex space-x-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-primary rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
};

export default LoadingSpinner;