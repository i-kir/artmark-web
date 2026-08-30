/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // 本文は素直なゴシック、見出しは明朝で「雑誌」らしい余韻を出す
        sans: ['"Noto Sans JP"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        serif: ['"Noto Serif JP"', 'Georgia', '"Times New Roman"', 'serif'],
      },
      colors: {
        // 未定義の色を使うと Tailwind はそのクラスを黙って捨てるため、
        // コード側で使っている名前をすべてここに揃えておく。
        //
        // 旧テーマ（navy×gold の冷たい配色）から、女性向けに
        // 「ダスティローズ×クリーム」の温かい配色へ全面的に置き換えた。
        // 既存クラス名（navy/gold）は色の意味を保ったまま値だけ差し替えている。
        navy: {
          DEFAULT: '#3E332E', // 見出し・濃色サーフェス（エスプレッソ）
          dark: '#332A26',    // ヒーローなどの濃色ブロック
          medium: '#6B584E',  // アバター背景など二次的な濃色
          accent: '#A76A54',  // バッジ・リンクなどの中間色
        },
        gold: {
          DEFAULT: '#BC6B55', // 主役アクセント（ダスティテラコッタローズ）
          light: '#EAD7CB',   // やわらかいアクセント地・チップ
        },
        // 意味を持たせた別名（今後はこちらを使う）
        cream: '#FBF7F3',
        rose: {
          DEFAULT: '#BC6B55',
          soft: '#D99C89',
          tint: '#F4E4DC',
        },
        sand: '#EAD7CB',
        mocha: '#6B584E',
        // gray は Tailwind の既定スケール（50〜950）に以下を追加する形で統合される
        gray: {
          light: '#FBF7F3',
          medium: '#8A7B71',
          dark: '#4A3F39',
        },
        star: '#E4A853',
      },
      boxShadow: {
        soft: '0 4px 20px -6px rgba(62, 51, 46, 0.14)',
        card: '0 1px 3px rgba(62, 51, 46, 0.05), 0 12px 28px -12px rgba(62, 51, 46, 0.14)',
      },
    },
  },
  plugins: [],
}
