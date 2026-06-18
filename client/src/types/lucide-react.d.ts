declare module 'lucide-react' {
  import { FC, SVGProps } from 'react';
  export interface IconProps extends SVGProps<SVGSVGElement> {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
  }
  export type Icon = FC<IconProps>;
  export const Briefcase: Icon;
  export const FileText: Icon;
  export const CheckSquare: Icon;
  export const User: Icon;
  export const Compass: Icon;
  export const LogOut: Icon;
  export const Plus: Icon;
  export const X: Icon;
  export const Upload: Icon;
  export const Sparkles: Icon;
  export const AlertCircle: Icon;
  // Fallback for any other icons imported
  const content: any;
  export default content;
}
