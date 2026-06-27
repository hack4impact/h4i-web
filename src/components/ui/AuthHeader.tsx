import Image from "next/image";

export function AuthHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-10 flex flex-col items-center gap-3">
      <Image
        src="/logo.svg"
        alt="Hack4Impact"
        width={120}
        height={18}
        className="logo-adaptive mb-4"
      />
      <h1 className="text-inverse text-center font-serif text-[28px] leading-tight font-light tracking-[-0.02em]">
        {title}
      </h1>
      {subtitle && <p className="label text-gray-3 text-center">{subtitle}</p>}
    </div>
  );
}
