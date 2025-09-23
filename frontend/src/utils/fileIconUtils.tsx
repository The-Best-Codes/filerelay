import { Archive, File, FileText, Image, Music, Video } from "lucide-react";

export const getFileIcon = (file: File | string) => {
  const className = "h-5 w-5";

  if (
    typeof file === "object" &&
    file !== null &&
    "type" in file &&
    "name" in file
  ) {
    const type = file.type.toLowerCase();

    if (type.startsWith("image/")) return <Image className={className} />;
    if (type.startsWith("video/")) return <Video className={className} />;
    if (type.startsWith("audio/")) return <Music className={className} />;
    if (type.includes("zip") || type.includes("rar") || type.includes("tar"))
      return <Archive className={className} />;
    if (type.includes("text") || type.includes("document"))
      return <FileText className={className} />;
    return <File className={className} />;
  }

  const fileName = file as string;
  const ext = fileName.toLowerCase().split(".").pop() || "";

  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext))
    return <Image className={className} />;
  if (["mp4", "avi", "mov", "mkv", "webm"].includes(ext))
    return <Video className={className} />;
  if (["mp3", "wav", "flac", "aac", "ogg"].includes(ext))
    return <Music className={className} />;
  if (["zip", "rar", "tar", "7z", "gz"].includes(ext))
    return <Archive className={className} />;
  if (["txt", "doc", "docx", "pdf", "rtf"].includes(ext))
    return <FileText className={className} />;
  return <File className={className} />;
};
