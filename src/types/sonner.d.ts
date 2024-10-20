declare module 'sonner' {
  import { ReactNode } from 'react';

  export interface ToasterProps {
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
    expand?: boolean;
    theme?: 'light' | 'dark' | 'system';
    closeButton?: boolean;
    className?: string;
    toastOptions?: {
      classNames?: {
        toast?: string;
        title?: string;
        description?: string;
        loader?: string;
        actionButton?: string;
        cancelButton?: string;
        // Add other class names as needed
      };
      // Add other toast options as needed
    };
    // Add other props as needed
  }

  export const Toaster: React.FC<ToasterProps>;

  // Add other exports from sonner if needed
}
