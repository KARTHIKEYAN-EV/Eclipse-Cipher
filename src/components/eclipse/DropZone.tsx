import { useCallback, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";

export function DropZone({
  onFile,
  accept,
  label,
}: {
  onFile: (file: File) => void;
  accept?: string;
  label: string;
}) {
  const [drag, setDrag] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const handle = useCallback(
    (f: FileList | null) => {
      if (f && f[0]) onFile(f[0]);
    },
    [onFile],
  );
  return (
    <div
      className="drop-zone cursor-pointer"
      data-drag={drag}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files); }}
      onClick={() => ref.current?.click()}
    >
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handle(e.target.files)}
      />
      <div className="flex flex-col items-center gap-2 opacity-90">
        <UploadCloud size={28} />
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs opacity-60">Drop a file or click to browse</p>
      </div>
    </div>
  );
}
