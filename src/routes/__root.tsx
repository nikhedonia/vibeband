import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'

import WorkOSProvider from '../integrations/workos/provider'
import AppLayout from '../components/AppLayout'

import appCss from '../styles.css?url'

import type { ApolloClientIntegration } from '@apollo/client-integration-tanstack-start'

interface MyRouterContext extends ApolloClientIntegration.RouterContext {}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'VibeBand — Kanban' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="bg-gray-950 text-white">
        <WorkOSProvider>
          <AppLayout>{children}</AppLayout>
        </WorkOSProvider>
        <Scripts />
      </body>
    </html>
  )
}
