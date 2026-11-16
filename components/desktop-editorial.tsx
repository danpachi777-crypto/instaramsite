import Image from "next/image";
import Link from "next/link";

export function DesktopEditorial() {
  return (
    <div className="desktop-editorial-grid">
      {[
        {
          image: "world",
          label: "EXPLORE",
          title: "ひらめきが、生まれる瞬間。",
          link: "テンプレートを見る",
          href: "/templates",
        },
        {
          image: "connection",
          label: "CREATE",
          title: "次の一本へ、表現をつなぐ。",
          link: "使い方を見る",
          href: "/#how",
        },
        {
          image: "next",
          label: "WHAT'S NEXT",
          title: "新しいスタイルを、見逃さないで。",
          link: "先行案内について",
          href: "/#waitlist",
        },
      ].map((card) => (
        <article key={card.image}>
          <Image
            src={`/motion/previews/${card.image}.webp`}
            fill
            sizes="33vw"
            alt=""
            unoptimized
          />
          <div>
            <span>{card.label}</span>
            <h3>
              <Link href={card.href}>{card.title}</Link>
            </h3>
            <Link href={card.href} className="desktop-editorial-link">
              {card.link} +
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
