// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::TrayIconBuilder,
    Emitter, Manager, WindowEvent,
};

#[derive(Clone, serde::Serialize)]
struct Payload {
    message: String,
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--hidden"]),
        ))
        .setup(|app| {
            // Получаем главное окно
            let window = app.get_webview_window("main").unwrap();
            let window_clone = window.clone();

            // Создаем контекстное меню для трея
            let show_item = MenuItem::with_id(app, "show", "Показать приложение", true, None::<&str>)?;
            let hide_item = MenuItem::with_id(app, "hide", "Скрыть в трей", true, None::<&str>)?;
            let notifications_item = MenuItem::with_id(app, "toggle-notifications", "Уведомления: Включены", true, None::<&str>)?;
            let quit_item = PredefinedMenuItem::quit(app, Some("Закрыть приложение"))?;
            let menu = Menu::with_items(app, &[&show_item, &hide_item, &notifications_item, &quit_item])?;

            // Создаем иконку трея
            let _tray = TrayIconBuilder::new()
                .menu(&menu)
                .show_menu_on_left_click(false)
                .icon_as_template(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            window.show().unwrap();
                            window.set_focus().unwrap();
                        }
                    }
                    "hide" => {
                        if let Some(window) = app.get_webview_window("main") {
                            window.hide().unwrap();
                        }
                    }
                    "toggle-notifications" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.emit("toggle-notifications", Payload {
                                message: "toggle".to_string(),
                            });
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(move |_tray, event| {
                    if let tauri::tray::TrayIconEvent::Click { button: tauri::tray::MouseButton::Left, .. } = event {
                        if window_clone.is_visible().unwrap() {
                            window_clone.hide().unwrap();
                        } else {
                            window_clone.show().unwrap();
                            window_clone.set_focus().unwrap();
                        }
                    }
                })
                .build(app)?;

            // Обработка события закрытия окна - минимизировать в трей вместо закрытия
            window.clone().on_window_event(move |event| match event {
                WindowEvent::CloseRequested { api, .. } => {
                    api.prevent_close();
                    window.hide().unwrap();
                }
                _ => {}
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
