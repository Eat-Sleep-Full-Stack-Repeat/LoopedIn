import { Sizes } from "@/Styles/sizes";
import { useSize } from "@/context/SizeContext";

export function useAppSize() {
  const { currentSize } = useSize();
  return Sizes[currentSize];
}
