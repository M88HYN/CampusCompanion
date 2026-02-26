import { GraduationCap } from "lucide-react";

interface StudyMateLogoProps {
  sizeClassName?: string;
}

export function StudyMateLogo({ sizeClassName = "h-10 w-10" }: StudyMateLogoProps) {
  return (
    <div className={`${sizeClassName} rounded-lg bg-slate-900 text-white flex items-center justify-center`}>
      <GraduationCap className="h-5 w-5" />
    </div>
  );
}
