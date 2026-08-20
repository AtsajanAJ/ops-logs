"use client";

import Link from "next/link";
import { Fragment } from "react";
import { usePathname } from "next/navigation";

import { useLocale } from "@/components/locale-provider";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getBreadcrumbs } from "@/lib/breadcrumbs";

export function AppBreadcrumb(): React.JSX.Element {
  const pathname = usePathname();
  const { t } = useLocale();
  const crumbs = getBreadcrumbs(pathname);

  return (
    <Breadcrumb>
      <BreadcrumbList className="text-slate-500">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          const label = crumb.labelKey.includes(".")
            ? t(crumb.labelKey)
            : crumb.labelKey;

          return (
            <Fragment key={`${crumb.labelKey}-${index}`}>
              {index > 0 ? <BreadcrumbSeparator /> : null}
              <BreadcrumbItem>
                {isLast || !crumb.href ? (
                  <BreadcrumbPage className="font-medium text-slate-950">
                    {label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    render={<Link href={crumb.href} />}
                    className="text-slate-500 hover:text-slate-950"
                  >
                    {label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
