declare module '@radix-ui/react-tabs' {
  import * as React from 'react';

  type TabsProps = {
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
    orientation?: 'horizontal' | 'vertical';
    dir?: 'ltr' | 'rtl';
    activationMode?: 'automatic' | 'manual';
  };

  const Root: React.FC<TabsProps>;
  
  type ListProps = React.HTMLAttributes<HTMLDivElement>;
  const List: React.ForwardRefExoticComponent<ListProps & React.RefAttributes<HTMLDivElement>>;
  
  type TriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string };
  const Trigger: React.ForwardRefExoticComponent<TriggerProps & React.RefAttributes<HTMLButtonElement>>;
  
  type ContentProps = React.HTMLAttributes<HTMLDivElement> & { value: string };
  const Content: React.ForwardRefExoticComponent<ContentProps & React.RefAttributes<HTMLDivElement>>;

  export {
    Root,
    List,
    Trigger,
    Content
  }
}
