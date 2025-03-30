import { cn } from "@/lib/utils";
import { useLoadingDots } from "./hooks/useLoadingDots";

interface LoadingDotsProps {
  className?: string;
  dotSize?: string;
  dotColor?: string;
  count?: number;
  interval?: number;
}

export function LoadingDots({
  className,
  dotSize = "h-2 w-2",
  dotColor = "bg-gray-400",
  count = 3,
  interval = 300
}: LoadingDotsProps) {
  const dots = useLoadingDots({ count, interval });
  
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="flex space-x-2">
        {dots.map((size, index) => (
          <div 
            key={index}
            className={cn(
              dotSize,
              dotColor,
              "rounded-full transition-all duration-300 dark:bg-[#ead19f]",
              size === 1 ? "scale-150 opacity-100" : "scale-100 opacity-60"
            )}
          />
        ))}
      </div>
    </div>
  );
} 