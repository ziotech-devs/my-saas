export const LoadingDots = () => (
  <div className="flex justify-start">
    <div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-3 h-9">
      <div className="size-1.5 rounded-full bg-foreground/50 animate-[pulse_1.5s_ease-in-out_infinite]" />
      <div className="size-1.5 rounded-full bg-foreground/50 animate-[pulse_1.5s_ease-in-out_0.5s_infinite]" />
      <div className="size-1.5 rounded-full bg-foreground/50 animate-[pulse_1.5s_ease-in-out_1s_infinite]" />
    </div>
  </div>
);
