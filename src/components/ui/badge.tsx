import * as React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive';
}

function Badge({ className = '', variant = 'default', ...props }: BadgeProps) {
  const baseStyles = "inline-flex items-center px-2.5 py-0.5 text-xs font-bold uppercase transition-colors";
  
  const variants = {
    default: "border-2 border-border bg-fg text-bg",
    secondary: "border-2 border-border bg-bg text-fg",
    success: "border-2 border-green-600 bg-green-600 text-white",
    warning: "border-2 border-yellow-600 bg-yellow-600 text-black",
    destructive: "border-2 border-red-600 bg-red-600 text-white",
  };
  
  const classes = `${baseStyles} ${variants[variant]} ${className}`;
  
  return (
    <div className={classes} {...props} />
  );
}

export { Badge };