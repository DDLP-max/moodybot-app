import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, Plus } from "lucide-react";
import { useLocation } from "wouter";

interface StandardHeaderProps {
  modeName: string;
  modeIcon?: React.ReactNode;
  showQuestionLimit?: boolean;
  questionLimit?: {
    remaining: number;
    limit: number;
  };
}

export function StandardHeader({ 
  modeName, 
  modeIcon, 
  showQuestionLimit = false, 
  questionLimit 
}: StandardHeaderProps) {
  const [, setLocation] = useLocation();

  const getShareUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return 'https://app.moodybot.ai';
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-primary/20 bg-surface/50">
      <div className="flex items-center space-x-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/")}
          className="text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center space-x-2">
          <Eye className="text-primary text-xl" />
          <span className="font-black text-lg gradient-text">MoodyBot</span>
          <span className="text-sm text-muted-foreground">• {modeName}</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        {/* X Profile Link */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.open('https://x.com/MoodyBotAI', '_blank')}
          className="text-muted-foreground hover:text-primary"
        >
          <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          @MoodyBotAI
        </Button>
        
        {/* Website Link */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.open('https://moodybot.ai', '_blank')}
          className="text-muted-foreground hover:text-primary"
        >
          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Website
        </Button>
        
        {/* Share Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const shareUrl = getShareUrl();
            
            if (navigator.share) {
              navigator.share({
                title: 'MoodyBot - AI Emotional Intelligence',
                text: 'Check out MoodyBot - the AI that adapts to your emotional state and provides personalized support!',
                url: shareUrl
              });
            } else {
              navigator.clipboard.writeText(shareUrl);
            }
          }}
          className="text-muted-foreground hover:text-primary"
        >
          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
          Share
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/chat")}
          className="text-muted-foreground hover:text-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>
    </div>
  );
}

export function StandardFooter() {
  return (
    <div className="text-center py-4 border-t border-primary/20 bg-surface/30">
      <p className="text-xs text-muted-foreground">
        Powered by Grok-4 via OpenRouter • Full Cinematic Experience
      </p>
    </div>
  );
}
