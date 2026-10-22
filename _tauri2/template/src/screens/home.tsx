/** Home screen: app introduction plus runtime details reported by the Rust core. */
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/app-identity";
import { ipc, isTauri } from "@/lib/ipc";

export function HomePage() {
  const info = useQuery({ queryKey: ["app", "info"], queryFn: () => ipc.app.info(), enabled: isTauri() });

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="font-bold text-2xl">{APP_NAME}</h1>
        <p className="text-muted-foreground">{APP_DESCRIPTION}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Runtime</CardTitle>
          <CardDescription>Reported by the Rust core through a typed command.</CardDescription>
        </CardHeader>
        <CardContent>
          {!isTauri() && <p className="text-sm">Running in a browser. Start the app with Tauri to reach Rust.</p>}
          {info.isLoading && <p className="text-sm">Connecting…</p>}
          {info.isError && <p className="text-destructive text-sm">IPC unavailable: {info.error.message}</p>}
          {info.data && (
            <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-1 text-sm">
              <dt className="text-muted-foreground">Version</dt>
              <dd data-testid="app-version">{info.data.version}</dd>
              <dt className="text-muted-foreground">Platform</dt>
              <dd>
                <Badge variant="secondary">
                  {info.data.platform} / {info.data.arch}
                </Badge>
              </dd>
              <dt className="text-muted-foreground">Tauri</dt>
              <dd>{info.data.tauri}</dd>
            </dl>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
