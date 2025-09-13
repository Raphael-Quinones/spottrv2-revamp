import * as React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-bold uppercase tracking-wide transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50";
    
    const variants = {
      default: "border-2 border-border bg-fg text-bg hover:bg-bg hover:text-fg",
      secondary: "border-2 border-border bg-bg text-fg hover:bg-fg hover:text-bg",
      outline: "border-2 border-border bg-transparent hover:bg-fg hover:text-bg",
      ghost: "hover:bg-fg hover:text-bg",
    };
    
    const sizes = {
      default: "h-12 px-6 py-3 text-sm",
      sm: "h-9 px-4 text-xs",
      lg: "h-14 px-8 text-base",
    };
    
    const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;
    
    return (
      <button
        className={classes}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";