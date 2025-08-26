'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Bot, Sparkles, Zap } from 'lucide-react';

interface NiousparkLoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  showProgress?: boolean;
  className?: string;
}

export function NiousparkLoading({ 
  size = 'md', 
  message, 
  showProgress = false,
  className 
}: NiousparkLoadingProps) {
  const [progress, setProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState(message || 'Loading...');

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  useEffect(() => {
    if (showProgress) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + Math.random() * 10;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 200);

      return () => clearInterval(interval);
    }
  }, [showProgress]);

  useEffect(() => {
    if (!message) {
      const messages = [
        'Initializing Niouspark AI...',
        'Loading neural networks...',
        'Optimizing responses...',
        'Preparing smart features...',
        'Almost ready...'
      ];
      
      let messageIndex = 0;
      const messageInterval = setInterval(() => {
        setLoadingMessage(messages[messageIndex]);
        messageIndex = (messageIndex + 1) % messages.length;
      }, 1500);

      return () => clearInterval(messageInterval);
    }
  }, [message]);

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-4", className)}>
      {/* Main Spinner with Niouspark Branding */}
      <div className="relative">
        {/* Outer rotating ring */}
        <div className={cn(
          "rounded-full border-4 border-muted border-t-primary animate-spin",
          sizeClasses[size]
        )} />
        
        {/* Inner pulsing logo container */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn(
            "rounded-full bg-primary/10 flex items-center justify-center animate-pulse",
            {
              'h-6 w-6': size === 'sm',
              'h-8 w-8': size === 'md',
              'h-12 w-12': size === 'lg',
              'h-18 w-18': size === 'xl'
            }
          )}>
            <Bot className={cn("text-primary", iconSizes[size])} />
          </div>
        </div>
        
        {/* Sparkle effects */}
        <div className="absolute -top-1 -right-1">
          <Sparkles className="h-3 w-3 text-yellow-500 animate-bounce" />
        </div>
        <div className="absolute -bottom-1 -left-1">
          <Zap className="h-3 w-3 text-blue-500 animate-pulse" />
        </div>
      </div>

      {/* Loading Text */}
      <div className="text-center space-y-2">
        <div className="font-bold text-lg bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          Niouspark
        </div>
        <div className={cn(
          "text-muted-foreground transition-all duration-300",
          size === 'sm' ? 'text-xs' : size === 'lg' || size === 'xl' ? 'text-base' : 'text-sm'
        )}>
          {loadingMessage}
        </div>
      </div>

      {/* Progress Bar */}
      {showProgress && (
        <div className="w-48 space-y-1">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-blue-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground text-center">
            {Math.round(progress)}%
          </div>
        </div>
      )}

      {/* Animated Dots */}
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "rounded-full bg-primary animate-bounce",
              size === 'sm' ? 'h-1 w-1' : size === 'lg' || size === 'xl' ? 'h-2 w-2' : 'h-1.5 w-1.5'
            )}
            style={{
              animationDelay: `${i * 0.1}s`,
              animationDuration: '0.6s'
            }}
          />
        ))}
      </div>
    </div>
  );
}

interface NiousparkPageLoadingProps {
  message?: string;
  fullScreen?: boolean;
}

export function NiousparkPageLoading({ 
  message = "Loading Niouspark...", 
  fullScreen = false 
}: NiousparkPageLoadingProps) {
  return (
    <div className={cn(
      "flex items-center justify-center bg-background",
      fullScreen ? "min-h-screen" : "min-h-[400px]"
    )}>
      <div className="max-w-md mx-auto p-8 text-center">
        <NiousparkLoading 
          size="xl" 
          message={message} 
          showProgress={true}
          className="mb-6"
        />
        
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Powered by advanced AI technology</p>
          <p className="text-xs">Your data bundle solution</p>
        </div>
      </div>
    </div>
  );
}

interface InlineLoadingProps {
  text?: string;
  size?: 'sm' | 'md';
}

export function InlineLoading({ text = "Loading", size = 'sm' }: InlineLoadingProps) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "rounded-full border-2 border-muted border-t-primary animate-spin",
        size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
      )} />
      <span className={cn(
        "text-muted-foreground",
        size === 'sm' ? 'text-sm' : 'text-base'
      )}>
        {text}
      </span>
    </div>
  );
}

// For use in buttons
interface ButtonLoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
}

export function ButtonLoading({ isLoading, children, loadingText = "Loading..." }: ButtonLoadingProps) {
  if (isLoading) {
    return (
      <span className="flex items-center gap-2">
        <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
        {loadingText}
      </span>
    );
  }
  
  return <>{children}</>;
}
