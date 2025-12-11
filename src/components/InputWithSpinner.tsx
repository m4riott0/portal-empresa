import { Loader2 } from "lucide-react";
import { Input } from "./ui/input"; // caminho do seu componente
import { cn } from "@/lib/utils";

export function InputWithSpinner({ loading, className, ...props }) {
  return (
    <div
      className={cn(
        "flex items-center h-10 w-full rounded-md border border-input bg-background px-3 py-2",
        className
      )}
    >
      <Input
        {...props}
        className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
      />

      {loading && (
        <Loader2 className="ml-2 h-4 w-4 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}
