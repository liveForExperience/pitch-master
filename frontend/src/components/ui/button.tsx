import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.97]',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-black shadow-lg shadow-primary/20 hover:shadow-primary/35 hover:scale-[1.02]',
        secondary:
          'border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] text-gray-700 dark:text-neutral-300 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-100 dark:hover:bg-white/[0.06]',
        destructive:
          'border border-red-500/20 bg-red-500/[0.07] text-red-400 hover:border-red-500/35 hover:bg-red-500/[0.14]',
        ghost:
          'text-gray-500 dark:text-neutral-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06]',
        outline:
          'border border-gray-200 dark:border-neutral-700 bg-transparent hover:bg-gray-50 dark:hover:bg-white/[0.04] text-gray-700 dark:text-neutral-300',
        amber:
          'bg-amber-500 text-white shadow-lg shadow-amber-500/20 hover:scale-[1.02] hover:shadow-amber-500/35',
        gradient:
          'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 hover:scale-[1.02]',
      },
      size: {
        sm: 'h-8 px-4 text-xs rounded-xl',
        md: 'h-11 px-5 text-sm',
        lg: 'h-13 px-6 text-sm py-4',
        xl: 'h-14 px-7 text-base py-4',
        icon: 'h-9 w-9 rounded-xl p-0',
        'icon-sm': 'h-8 w-8 rounded-xl p-0 text-xs',
      },
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
