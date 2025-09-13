import * as React from "react";

const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className = '', ...props }, ref) => (
  <label
    ref={ref}
    className={`text-sm font-bold uppercase tracking-wide ${className}`}
    {...props}
  />
));
Label.displayName = "Label";

export { Label };