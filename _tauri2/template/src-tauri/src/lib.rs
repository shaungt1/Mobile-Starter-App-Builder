//! Application entry point shared by desktop, Android and iOS.
//!
//! `#[cfg_attr(mobile, tauri::mobile_entry_point)]` turns `run` into the entry
//! point the Android and iOS host apps call; desktop calls it from main.rs.
//! Desktop-only plugins must be registered inside `#[cfg(desktop)]` blocks and
//! limited to desktop targets in Cargo.toml, or mobile builds will not compile.

mod commands;
mod error;

pub use error::{AppError, AppResult};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(log::LevelFilter::Info)
                .build(),
        )
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        // @capability-plugins (do not remove: `capability install` inserts all-platform plugins here)
        .setup(|app| {
            // @capability-mobile-setup (do not remove: mobile-only plugins are registered here under #[cfg(mobile)])
            let _ = app;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![commands::app_info, commands::open_external])
        .run(tauri::generate_context!())
        .expect("error while running the application");
}
