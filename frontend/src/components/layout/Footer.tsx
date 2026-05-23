import { Shield } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t py-6">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4 text-bheda-500" />
          <span>Bheda Vulnerability Lab Platform</span>
        </div>
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Bheda. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
