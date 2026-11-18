import { routing } from "@wuod/i18n/routing";
import { createNavigation } from "next-intl/navigation";

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
