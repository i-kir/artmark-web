export default function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-rose-tint bg-sand/40 py-10">
      <div className="container mx-auto flex flex-col items-center px-4">
        <p className="font-serif text-lg tracking-wide text-rose">ArtMark</p>
        <p className="mt-2 text-sm text-gray-medium">美術館・展覧会のクチコミ</p>
        <div className="mt-4 flex space-x-5 text-sm">
          <a href="#" className="text-gray-medium transition hover:text-rose">
            X (Twitter)
          </a>
          <a href="#" className="text-gray-medium transition hover:text-rose">
            Instagram
          </a>
        </div>
        <p className="mt-6 text-xs text-gray-medium/80">© 2026 ArtMark</p>
      </div>
    </footer>
  );
}
