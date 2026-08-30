type GenreTagProps = {
  genre: string;
  active?: boolean;
  onClick?: () => void;
};

export default function GenreTag({ genre, active = false, onClick }: GenreTagProps) {
  const baseClasses = "px-3 py-1 rounded-full text-xs font-medium transition whitespace-nowrap";
  const interactiveClasses = onClick ? "cursor-pointer hover:opacity-80" : "";
  const stateClasses = active 
    ? "bg-navy text-white" 
    : "bg-gold-light text-navy";

  return (
    <span 
      className={`${baseClasses} ${interactiveClasses} ${stateClasses}`}
      onClick={onClick}
    >
      {genre}
    </span>
  );
}
