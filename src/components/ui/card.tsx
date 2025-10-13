import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { withEffects?: boolean }
>(({ className, withEffects = true, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-card text-card-foreground shadow-lg transition-all duration-500 ease-out relative overflow-hidden group",
      withEffects && "hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-[1.02] hover:-translate-y-1",
      "before:absolute before:top-0 before:left-0 before:w-full before:h-full before:opacity-0 before:transition-opacity before:duration-500",
      "before:bg-gradient-to-br before:from-blue-50/50 before:to-blue-100/30",
      "hover:before:opacity-100",
      className
    )}
    {...props}
  >
    {withEffects && (
      <>
        {/* Orbes flotantes */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-300 rounded-full blur-3xl opacity-0 group-hover:opacity-15 transition-opacity duration-500 animate-pulse" style={{ animationDelay: '0.5s' }} />
      </>
    )}
    <div className="relative z-10">
      {props.children}
    </div>
  </div>
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
