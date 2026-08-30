export default function Footer() {
  return (
    <footer className="w-full bg-navy py-8 mt-auto">
      <div className="container mx-auto px-4 flex flex-col items-center">
        <p className="text-white text-sm">
          © 2026 ArtMark - 美術館レビューサービス
        </p>
        <div className="flex space-x-4 mt-4">
          <a href="#" className="text-gray-400 hover:text-white transition">X (Twitter)</a>
          <a href="#" className="text-gray-400 hover:text-white transition">Instagram</a>
        </div>
      </div>
    </footer>
  );
}
