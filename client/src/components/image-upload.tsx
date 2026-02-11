import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2, Trash2, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ImageUploadProps {
  value?: string | null;
  onChange: (base64: string | null) => void;
  fallback?: string;
  disabled?: boolean;
  maxSizeKB?: number;
  maxDimension?: number;
}

const PRESET_EMOJIS = [
  "🚀", "💎", "🔥", "⚡", "🌙", "☀️", "🌟", "💫",
  "🎯", "🎮", "🎲", "🏆", "👑", "💰", "📈", "📊",
  "🦊", "🐺", "🦁", "🐯", "🦅", "🐉", "🦄", "🐳",
  "🤖", "👾", "🎭", "🎪", "🌈", "🍀", "💜", "💚",
  "🔮", "🧊", "💠", "🔷", "⭐", "✨", "🌀", "🎵",
];

function createEmojiDataUrl(emoji: string): string {
  const canvas = document.createElement("canvas");
  canvas.width = 200;
  canvas.height = 200;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  
  ctx.fillStyle = "hsl(142, 76%, 36%)";
  ctx.beginPath();
  ctx.arc(100, 100, 100, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.font = "100px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, 100, 105);
  
  return canvas.toDataURL("image/png");
}

async function compressImage(file: File, maxDimension: number, maxSizeKB: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.8;
        let dataUrl = canvas.toDataURL("image/jpeg", quality);

        while (dataUrl.length > maxSizeKB * 1024 * 1.37 && quality > 0.1) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }

        if (dataUrl.length > maxSizeKB * 1024 * 1.37) {
          const scale = Math.sqrt((maxSizeKB * 1024 * 1.37) / dataUrl.length);
          canvas.width = width * scale;
          canvas.height = height * scale;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        }

        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function ImageUpload({
  value,
  onChange,
  fallback = "U",
  disabled = false,
  maxSizeKB = 50,
  maxDimension = 200,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("please select an image file");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const compressed = await compressImage(file, maxDimension, maxSizeKB);
      onChange(compressed);
    } catch (err) {
      setError("failed to process image");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }, [onChange, maxDimension, maxSizeKB]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleRemove = useCallback(() => {
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [onChange]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    const dataUrl = createEmojiDataUrl(emoji);
    onChange(dataUrl);
    setEmojiOpen(false);
  }, [onChange]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="h-20 w-20 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
            <AvatarImage src={value || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl">
              {fallback}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled || isProcessing}
            data-testid="input-avatar-file"
          />

          <div
            className={`
              relative border-2 border-dashed rounded-md p-4 text-center cursor-pointer
              transition-colors
              ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/50"}
              ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !disabled && !isProcessing && inputRef.current?.click()}
            data-testid="dropzone-avatar"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">processing...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Upload className="h-4 w-4" />
                <span className="text-sm">drop image or click to upload</span>
              </div>
            )}
          </div>

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          <p className="text-xs text-muted-foreground">
            images are compressed to {maxDimension}x{maxDimension}px (max ~{maxSizeKB}kb)
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              className="flex-1"
              data-testid="button-emoji-picker"
            >
              <Smile className="h-4 w-4 mr-2" />
              pick an emoji
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" align="start">
            <p className="text-xs text-muted-foreground mb-2">select an emoji as your avatar</p>
            <div className="grid grid-cols-8 gap-1">
              {PRESET_EMOJIS.map((emoji, index) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleEmojiSelect(emoji)}
                  className="h-8 w-8 flex items-center justify-center text-lg hover-elevate rounded-md transition-colors"
                  data-testid={`button-emoji-${index}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {value && !disabled && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleRemove}
            data-testid="button-remove-avatar"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            remove
          </Button>
        )}
      </div>
    </div>
  );
}
