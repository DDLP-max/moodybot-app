import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share2, Eye } from "lucide-react";
import { motion } from "framer-motion";

interface QuoteCardProps {
  quote: string;
  source?: string | null;
  createdAt: Date | string;
}

export function QuoteCard({ quote, source, createdAt }: QuoteCardProps) {
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        text: quote,
        title: "Truth from the Shadow",
      });
    } else {
      navigator.clipboard.writeText(quote);
    }
  };

  const handleDownload = () => {
    // In a real implementation, this would generate and download an image
    console.log("Download quote card:", quote);
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="card-tarot shadow-neon relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-transparent to-accent/20" />
        </div>
        
        <CardContent className="p-6 relative z-10">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Eye className="h-6 w-6 text-primary" />
            </div>
            
            <h3 className="font-black text-lg mb-4 gradient-text">THE MIRROR</h3>
            
            <blockquote className="text-sm mb-4 italic text-foreground leading-relaxed">
              "{quote}"
            </blockquote>
            
            {source && (
              <p className="text-xs text-muted-foreground mb-4">
                {source}
              </p>
            )}
            
            <p className="text-xs text-muted-foreground">
              {new Date(createdAt).toLocaleDateString()}
            </p>
          </div>
        </CardContent>
        
        {/* Action buttons */}
        <div className="absolute bottom-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleShare}
            className="bg-primary/20 hover:bg-primary/40 text-primary"
          >
            <Share2 className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDownload}
            className="bg-accent/20 hover:bg-accent/40 text-accent"
          >
            <Download className="h-3 w-3" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
