import { Avatar as BaseAvatar } from "@base-ui/react/avatar";
import { cn } from "@/lib/utils";

type AvatarSize = "sm" | "md" | "lg";

const sizes: Record<AvatarSize, { container: string; text: string }> = {
  sm: { container: "h-24 w-24", text: "text-[11px]" },
  md: { container: "h-48 w-48", text: "text-lg" },
  lg: { container: "h-72 w-72", text: "text-[22px]" },
};

function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

type AvatarProps = {
  name?: string | null;
  image?: string | null;
  size?: AvatarSize;
  className?: string;
};

export function Avatar({ name, image, size = "md", className }: AvatarProps) {
  const { container, text } = sizes[size];
  return (
    <BaseAvatar.Root
      className={cn(
        "bg-blue-3 rounded-6 flex shrink-0 items-center justify-center overflow-hidden font-medium text-white",
        container,
        className
      )}
    >
      {image && (
        <BaseAvatar.Image
          src={image}
          alt={name ?? ""}
          className="h-full w-full object-cover"
        />
      )}
      <BaseAvatar.Fallback className={text}>
        {getInitials(name)}
      </BaseAvatar.Fallback>
    </BaseAvatar.Root>
  );
}
