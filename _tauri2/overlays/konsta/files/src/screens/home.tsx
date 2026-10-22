/** Home screen for Konsta UI: runtime details as a native-style list. */
import { useQuery } from "@tanstack/react-query";
import { Block, BlockTitle, List, ListItem } from "konsta/react";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/app-identity";
import { ipc, isTauri } from "@/lib/ipc";

export function HomePage() {
  const info = useQuery({ queryKey: ["app", "info"], queryFn: () => ipc.app.info(), enabled: isTauri() });

  return (
    <>
      <Block>
        <h1 className="font-bold text-2xl">{APP_NAME}</h1>
        <p className="opacity-70">{APP_DESCRIPTION}</p>
      </Block>
      <BlockTitle>Runtime</BlockTitle>
      {!isTauri() && <Block>Running in a browser. Start the app with Tauri to reach Rust.</Block>}
      {info.isLoading && <Block>Connecting…</Block>}
      {info.isError && <Block className="text-red-600">IPC unavailable: {info.error.message}</Block>}
      {info.data && (
        <List inset strong>
          <ListItem after={<span data-testid="app-version">{info.data.version}</span>} title="Version" />
          <ListItem after={`${info.data.platform} / ${info.data.arch}`} title="Platform" />
          <ListItem after={info.data.tauri} title="Tauri" />
        </List>
      )}
    </>
  );
}
