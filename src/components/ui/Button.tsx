"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "ghost" | "high-contrast";
type ButtonSize = "xs" | "default" | "lg" | "xl";

const variantClass: Record<ButtonVariant, string> = {
  default: "",
  ghost: "btn-ghost",
  "high-contrast": "btn-high-contrast",
};

const sizeClass: Record<ButtonSize, string> = {
  xs: "btn-xs",
  default: "",
  lg: "btn-lg",
  xl: "btn-xl",
};

interface ButtonProps extends ButtonPrimitive.Props {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

function Button({
  variant = "default",
  size = "default",
  className,
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn("btn", variantClass[variant], sizeClass[size], className)}
      {...props}
    />
  );
}

export { Button };
export type { ButtonProps };
