
import React, { useState } from 'react';
import { ChevronDown as ChevronDownIcon } from './Icons';
import { cn } from '../utils/utils';

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

const Accordion: React.FC<AccordionProps> = ({ title, children, defaultOpen = false, className }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn("border-b border-zinc-100 group/acc", className)}>
      <button
        className="flex justify-between items-center w-full py-5 text-left focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-[11px] font-black text-zinc-900 uppercase tracking-widest group-hover/acc:text-zinc-500 transition-colors not-italic">{title}</span>
        <span className={cn("transform transition-transform duration-500", isOpen ? 'rotate-180 text-zinc-900' : 'text-zinc-300')}>
          <ChevronDownIcon className="h-4 w-4" />
        </span>
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-500 ease-in-out",
          isOpen ? 'max-h-[500px] opacity-100 pb-6' : 'max-h-0 opacity-0'
        )}
      >
        <div className="text-[13px] text-zinc-500 leading-relaxed font-medium">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Accordion;
