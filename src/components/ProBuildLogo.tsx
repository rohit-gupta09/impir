import { Wrench, Settings } from 'lucide-react';

const ProBuildLogo = ({ collapsed = false }: { collapsed?: boolean }) => (
  <div className="flex items-center gap-2">
    <div className="relative flex items-center justify-center w-9 h-9 rounded bg-accent">
      <Wrench className="w-4 h-4 text-accent-foreground absolute -rotate-45 translate-x-[-2px]" />
      <Settings className="w-4 h-4 text-accent-foreground absolute translate-x-[2px] translate-y-[1px]" />
    </div>
    {!collapsed && (
      <div className="flex flex-col leading-none">
        <span className="font-display text-lg font-bold tracking-wide text-sidebar-foreground">ROMART</span>
      </div>
    )}
  </div>
);

export default ProBuildLogo;
