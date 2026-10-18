import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ComponentProps, ReactNode } from "react";

export type ToolSelectorProps = ComponentProps<typeof Dialog>;

export const ToolSelector = (props: ToolSelectorProps) => (
  <Dialog {...props} />
);

export type ToolSelectorTriggerProps = ComponentProps<typeof DialogTrigger>;

export const ToolSelectorTrigger = (props: ToolSelectorTriggerProps) => (
  <DialogTrigger {...props} />
);

export type ToolSelectorContentProps = ComponentProps<typeof DialogContent> & {
  title?: ReactNode;
};

export const ToolSelectorContent = ({
  className,
  children,
  title = "Select Tools & Settings",
  ...props
}: ToolSelectorContentProps) => (
  <DialogContent
    aria-describedby={undefined}
    className={cn(
      "p-0 border border-white/10 bg-[#131317]/98 text-white shadow-[0_24px_80px_rgba(0,0,0,0.85)] rounded-2xl overflow-hidden max-w-xl sm:max-w-2xl z-[90] backdrop-blur-2xl",
      className
    )}
    {...props}
  >
    <DialogTitle className="sr-only">{title}</DialogTitle>
    <Command className="bg-transparent text-white border-0">
      {children}
    </Command>
  </DialogContent>
);

export type ToolSelectorDialogProps = ComponentProps<typeof CommandDialog>;

export const ToolSelectorDialog = (props: ToolSelectorDialogProps) => (
  <CommandDialog {...props} />
);

export type ToolSelectorInputProps = ComponentProps<typeof CommandInput>;

export const ToolSelectorInput = ({
  className,
  ...props
}: ToolSelectorInputProps) => (
  <CommandInput className={cn("h-auto py-3.5", className)} {...props} />
);

export type ToolSelectorListProps = ComponentProps<typeof CommandList>;

export const ToolSelectorList = (props: ToolSelectorListProps) => (
  <CommandList {...props} />
);

export type ToolSelectorEmptyProps = ComponentProps<typeof CommandEmpty>;

export const ToolSelectorEmpty = (props: ToolSelectorEmptyProps) => (
  <CommandEmpty {...props} />
);

export type ToolSelectorGroupProps = ComponentProps<typeof CommandGroup>;

export const ToolSelectorGroup = (props: ToolSelectorGroupProps) => (
  <CommandGroup {...props} />
);

export type ToolSelectorItemProps = ComponentProps<typeof CommandItem>;

export const ToolSelectorItem = (props: ToolSelectorItemProps) => (
  <CommandItem {...props} />
);

export type ToolSelectorShortcutProps = ComponentProps<typeof CommandShortcut>;

export const ToolSelectorShortcut = (props: ToolSelectorShortcutProps) => (
  <CommandShortcut {...props} />
);

export type ToolSelectorSeparatorProps = ComponentProps<
  typeof CommandSeparator
>;

export const ToolSelectorSeparator = (props: ToolSelectorSeparatorProps) => (
  <CommandSeparator {...props} />
);

export type ToolSelectorNameProps = ComponentProps<"span">;

export const ToolSelectorName = ({
  className,
  ...props
}: ToolSelectorNameProps) => (
  <span className={cn("font-medium text-xs text-neutral-100", className)} {...props} />
);

export type ToolSelectorDescriptionProps = ComponentProps<"span">;

export const ToolSelectorDescription = ({
  className,
  ...props
}: ToolSelectorDescriptionProps) => (
  <span className={cn("text-[11px] text-neutral-400 line-clamp-1", className)} {...props} />
);
