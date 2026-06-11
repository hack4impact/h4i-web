import Image from "next/image";

export function AuthHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-8 flex flex-col items-center">
      <Image
        src="/logo.svg"
        alt="Hack4Impact"
        width={132}
        height={20}
        className="logo-adaptive mb-8"
      />
      <h1 className="text-inverse text-center font-serif text-[30px] leading-tight font-light tracking-[-0.02em]">
        {title}
      </h1>
      <p className="label text-gray-3 mt-2 text-center">{subtitle}</p>
    </div>
  );
}
