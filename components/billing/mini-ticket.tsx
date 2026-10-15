/**
 * A small ticket stapled to the Premium receipt: it shows the extra (the event
 * ticket on the guest page) as an object, not another line of text. Pure CSS,
 * the same notched shape and colours as the real ticket (components/ui/
 * event-ticket.tsx), without its shader.
 */
export function MiniTicket({ title, sub }: { title: string; sub: string }) {
  return (
    <div
      aria-hidden
      className="relative w-44 rotate-[7deg] drop-shadow-[0_10px_14px_rgb(20_35_60/0.35)]"
    >
      <div
        className="relative flex h-[4.5rem] items-stretch overflow-hidden rounded-[10px] bg-[#4d7399] text-[#f4f8fc] [mask:radial-gradient(circle_7px_at_76%_0,transparent_98%,#000)_top/100%_51%_no-repeat,radial-gradient(circle_7px_at_76%_100%,transparent_98%,#000)_bottom/100%_51%_no-repeat]"
        style={{
          backgroundImage:
            "radial-gradient(rgb(255 255 255 / 0.16) 1px, transparent 1px)",
          backgroundSize: "5px 5px",
        }}
      >
        <div className="flex min-w-0 flex-1 flex-col justify-center ps-3 pe-2">
          <span className="font-heading text-[15px] leading-tight font-semibold">
            {title}
          </span>
          <span className="mt-0.5 text-[9.5px] leading-snug opacity-85">
            {sub}
          </span>
        </div>
        <span className="w-px self-stretch border-s border-dashed border-white/50" />
        <span className="flex w-[24%] items-center justify-center text-[9px] font-bold tracking-[0.12em] [writing-mode:vertical-rl]">
          PREMIUM
        </span>
      </div>
      {/* staple */}
      <span className="absolute start-6 -top-1 h-2.5 w-4 rounded-[2px] border-2 border-[oklch(0.7_0.01_245)] border-b-transparent" />
    </div>
  );
}
